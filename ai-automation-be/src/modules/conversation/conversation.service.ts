import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { LlmService } from '../../common/llm/llm.service.js';
import { KnowledgeSearchService } from '../knowledge/services/knowledge-search.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TestChatDto } from './dto/test-chat.dto.js';
import { ChatResponseDto } from './dto/chat-response.dto.js';
import { ChannelService } from '../channel/channel.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WS_EVENTS } from '../../common/ws-events.js';
import type OpenAI from 'openai';

const HISTORY_LIMIT = 20;

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly knowledgeSearch: KnowledgeSearchService,
    private readonly channelService: ChannelService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async verifyTenantAccess(tenantId: string, sellerId: string) {
    const membership = await this.prisma.tenantMember.findFirst({
      where: { tenantId, sellerId, isActive: true },
    });
    if (!membership) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }
    return membership;
  }

  /**
   * Load agent → save user msg → build context → call LLM → save reply → return
   */
  async sendMessage(
    sellerId: string,
    tenantId: string,
    dto: SendMessageDto,
  ): Promise<ChatResponseDto> {
    const metrics: Record<string, number> = {};
    const pipelineStart = Date.now();
    let stageStart: number;

    await this.verifyTenantAccess(tenantId, sellerId);

    // Stage 1: Context — load agent config
    stageStart = Date.now();
    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, tenantId, isActive: true },
    });
    if (!agent) {
      throw new NotFoundException('Bot không tồn tại hoặc đã bị vô hiệu hóa');
    }
    metrics['context'] = Date.now() - stageStart;

    // Quota check: reject nếu tenant đã hết quota
    stageStart = Date.now();
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { messageUsed: true, messageQuota: true },
    });
    if (tenant && tenant.messageUsed >= tenant.messageQuota) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Đã hết quota tin nhắn (${tenant.messageUsed}/${tenant.messageQuota}). Vui lòng nâng cấp gói.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    metrics['quota_check'] = Date.now() - stageStart;

    // Stage 2: Resolve customer + conversation
    stageStart = Date.now();
    const customer = await this.resolveCustomer(tenantId, dto);
    const conversation = await this.resolveConversation(
      tenantId,
      agent.id,
      customer.id,
      dto.conversationId,
    );
    metrics['resolve'] = Date.now() - stageStart;

    // Stage 3: Save customer message
    stageStart = Date.now();
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'CUSTOMER',
        content: dto.message,
      },
    });
    metrics['save_input'] = Date.now() - stageStart;

    // Stage 4: History — load last N messages for context
    stageStart = Date.now();
    const recentHistory = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });
    const history = recentHistory.reverse();
    metrics['history'] = Date.now() - stageStart;

    // Stage 5: Knowledge Search — semantic search top-K chunks (graceful fallback)
    stageStart = Date.now();
    let knowledgeContext: string | null = null;
    try {
      knowledgeContext = await this.knowledgeSearch.buildKnowledgeContext(
        tenantId,
        dto.message,
      );
    } catch (error) {
      this.logger.warn(
        `Knowledge search failed (non-fatal): ${error instanceof Error ? error.message : error}`,
      );
    }
    metrics['knowledge'] = Date.now() - stageStart;

    // Stage 6: Build prompt (persona + knowledge + history)
    const llmMessages = this.buildLlmMessages(agent, history, knowledgeContext);

    // Stage 7: LLM — call AI model
    stageStart = Date.now();
    let replyContent: string;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
      const completion = await this.llm.chat(llmMessages, {
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      });

      replyContent = completion.choices[0]?.message?.content ?? agent.greeting;
      promptTokens = completion.usage?.prompt_tokens ?? 0;
      completionTokens = completion.usage?.completion_tokens ?? 0;
      totalTokens = completion.usage?.total_tokens ?? 0;
    } catch (error) {
      this.logger.error(
        `LLM call failed for conversation=${conversation.id}: ${error instanceof Error ? error.message : error}`,
      );
      throw new InternalServerErrorException(
        'Bot hiện không thể trả lời. Vui lòng thử lại sau.',
      );
    }
    metrics['llm'] = Date.now() - stageStart;

    // Stage 8: Response — save reply + update quota
    stageStart = Date.now();
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: replyContent,
        promptTokens: promptTokens || null,
        completionTokens: completionTokens || null,
      },
    });

    // Update conversation lastMessageAt + increment tenant message quota
    await Promise.all([
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { messageUsed: { increment: 1 } },
      }),
    ]);
    metrics['response'] = Date.now() - stageStart;

    // Pipeline metrics log
    const totalMs = Date.now() - pipelineStart;
    const metricsStr = Object.entries(metrics)
      .map(([k, v]) => `${k}=${v}ms`)
      .join(' ');
    this.logger.log(
      `[Pipeline] agent="${agent.name}" conv=${conversation.id} total=${totalMs}ms | ${metricsStr} | tokens=${totalTokens}`,
    );

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      reply: replyContent,
      agentName: agent.name,
      usage: { promptTokens, completionTokens, totalTokens },
    };
  }

  /**
   * Danh sách hội thoại của tenant, sắp xếp theo tin nhắn mới nhất
   */
  async findAll(sellerId: string, tenantId: string) {
    await this.verifyTenantAccess(tenantId, sellerId);

    return this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        agent: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      take: 50,
    });
  }

  /**
   * Lịch sử tin nhắn của 1 hội thoại
   */
  async getMessages(
    sellerId: string,
    tenantId: string,
    conversationId: string,
  ) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        agent: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return { conversation, messages };
  }

  /**
   * Đánh dấu hội thoại đã xử lý xong (RESOLVED)
   */
  async resolveConversationStatus(
    sellerId: string,
    tenantId: string,
    conversationId: string,
  ) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'RESOLVED' },
    });

    this.eventEmitter.emit(WS_EVENTS.CONVERSATION_UPDATED, {
      tenantId,
      conversationId,
      status: 'RESOLVED',
      lastMessageAt: updated.lastMessageAt,
    });

    return updated;
  }

  /**
   * Nhân viên gửi tin nhắn trực tiếp (không qua LLM).
   * Tự động chuyển status sang OPEN nếu đang là BOT_HANDLING.
   */
  async humanReply(
    sellerId: string,
    tenantId: string,
    conversationId: string,
    content: string,
  ) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }

    // Step 1: Lưu tin nhắn với role HUMAN_AGENT
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'HUMAN_AGENT',
        content,
      },
    });

    // Step 2: Chuyển status sang OPEN (nhân viên cướp quyền) + cập nhật lastMessageAt
    const shouldTakeover =
      conversation.status === 'BOT_HANDLING' ||
      conversation.status === 'RESOLVED';
    const newStatus = shouldTakeover ? 'OPEN' : conversation.status;
    const lastMessageAt = new Date();

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: newStatus,
        lastMessageAt,
      },
    });

    this.logger.log(
      `[HumanReply] seller=${sellerId} conv=${conversationId} status=${conversation.status}->${newStatus}`,
    );

    // Step 3: Gửi tin nhắn qua Facebook Messenger (fire-and-forget)
    this.channelService
      .sendHumanReplyToChannel(conversationId, content)
      .catch((err) => {
        this.logger.error(
          `[HumanReply] Failed to send to channel: ${err instanceof Error ? err.message : err}`,
        );
      });

    // Emit WS events (fire-and-forget, không block response)
    this.emitHumanReplyEvents(
      tenantId,
      conversationId,
      message,
      newStatus,
      lastMessageAt,
    );

    return {
      messageId: message.id,
      conversationId,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt,
    };
  }

  /**
   * Emit WS events cho humanReply (message + status update).
   * Tách ra method riêng để không làm chậm response trả về client.
   */
  private emitHumanReplyEvents(
    tenantId: string,
    conversationId: string,
    message: {
      id: string;
      role: string;
      content: string | null;
      createdAt: Date;
    },
    newStatus: string,
    lastMessageAt: Date,
  ) {
    this.eventEmitter.emit(WS_EVENTS.NEW_MESSAGE, {
      tenantId,
      conversationId,
      message: {
        id: message.id,
        conversationId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    });

    this.eventEmitter.emit(WS_EVENTS.CONVERSATION_UPDATED, {
      tenantId,
      conversationId,
      status: newStatus,
      lastMessageAt,
    });
  }

  /**
   * Nhân viên bàn giao hội thoại cho Bot xử lý tự động.
   * Chuyển status → BOT_HANDLING để bot tiếp tục trả lời tin nhắn mới.
   */
  async handoverToBot(
    sellerId: string,
    tenantId: string,
    conversationId: string,
  ) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }

    if (conversation.status === 'BOT_HANDLING') {
      return { conversationId, status: conversation.status };
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'BOT_HANDLING' },
    });

    // Ghi log hệ thống để nhân viên biết ai đã bàn giao
    const systemMsg = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'SYSTEM',
        content: 'Hội thoại đã được bàn giao cho Bot xử lý tự động.',
      },
    });

    this.logger.log(
      `[Handover] seller=${sellerId} conv=${conversationId} ${conversation.status}->BOT_HANDLING`,
    );

    // Emit WS events
    this.eventEmitter.emit(WS_EVENTS.CONVERSATION_UPDATED, {
      tenantId,
      conversationId,
      status: 'BOT_HANDLING',
      lastMessageAt: updated.lastMessageAt,
    });

    this.eventEmitter.emit(WS_EVENTS.NEW_MESSAGE, {
      tenantId,
      conversationId,
      message: {
        id: systemMsg.id,
        conversationId,
        role: systemMsg.role,
        content: systemMsg.content,
        createdAt: systemMsg.createdAt,
      },
    });

    return { conversationId, status: updated.status };
  }

  // === Test Chat (no DB persistence) ===

  /**
   * Test chat: gọi LLM với persona của agent nhưng KHÔNG lưu gì vào DB.
   * History được FE gửi lên (in-memory) để duy trì context trong phiên test.
   */
  async testMessage(sellerId: string, tenantId: string, dto: TestChatDto) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, tenantId },
    });
    if (!agent) {
      throw new NotFoundException('Bot không tồn tại');
    }

    // Build LLM messages từ in-memory history (FE gửi lên)
    const llmMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: agent.persona },
    ];

    if (dto.history) {
      for (const msg of dto.history) {
        llmMessages.push({
          role: msg.role === 'CUSTOMER' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Thêm tin nhắn hiện tại
    llmMessages.push({ role: 'user', content: dto.message });

    try {
      this.logger.log(
        `[TEST] Calling LLM for agent="${agent.name}" (${llmMessages.length} messages)`,
      );

      const completion = await this.llm.chat(llmMessages, {
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      });

      const replyContent =
        completion.choices[0]?.message?.content ?? agent.greeting;
      const promptTokens = completion.usage?.prompt_tokens ?? 0;
      const completionTokens = completion.usage?.completion_tokens ?? 0;
      const totalTokens = completion.usage?.total_tokens ?? 0;

      this.logger.log(`[TEST] Reply received: ${totalTokens} tokens`);

      return {
        reply: replyContent,
        agentName: agent.name,
        usage: { promptTokens, completionTokens, totalTokens },
      };
    } catch (error) {
      this.logger.error(
        `[TEST] LLM call failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new InternalServerErrorException(
        'Bot hiện không thể trả lời. Vui lòng thử lại sau.',
      );
    }
  }

  // === Private helpers ===

  private async resolveCustomer(tenantId: string, dto: SendMessageDto) {
    if (dto.customerId) {
      const existing = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!existing) throw new NotFoundException('Không tìm thấy khách hàng');
      return existing;
    }

    const customerName = dto.customerName || 'Khách vãng lai';
    return this.prisma.customer.create({
      data: {
        tenantId,
        name: customerName,
      },
    });
  }

  private async resolveConversation(
    tenantId: string,
    agentId: string,
    customerId: string,
    conversationId?: string,
  ) {
    if (conversationId) {
      const existing = await this.prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
      });
      if (!existing) throw new NotFoundException('Không tìm thấy hội thoại');
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        tenantId,
        agentId,
        customerId,
        status: 'BOT_HANDLING',
      },
    });
  }

  private buildLlmMessages(
    agent: { persona: string },
    history: { role: string; content: string | null }[],
    knowledgeContext?: string | null,
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // System prompt = persona + knowledge context (if available)
    let systemPrompt = agent.persona;

    if (knowledgeContext) {
      systemPrompt += `\n\n<knowledge>\nThông tin sản phẩm/dịch vụ liên quan (chỉ tham khảo, KHÔNG bịa thêm):\n---\n${knowledgeContext}\n</knowledge>\n\nQuy tắc:\n- Ưu tiên trả lời dựa trên thông tin trong <knowledge> nếu có.\n- Nếu không tìm thấy câu trả lời cụ thể trong knowledge, hãy trả lời bằng kiến thức chung.\n- Luôn giữ đúng giọng nói và phong cách trong persona.`;
    }

    messages.push({ role: 'system', content: systemPrompt });

    // Conversation history → map DB roles to OpenAI roles
    for (const msg of history) {
      if (!msg.content) continue;

      let role: 'user' | 'assistant' | 'system';
      switch (msg.role) {
        case 'CUSTOMER':
          role = 'user';
          break;
        case 'ASSISTANT':
        case 'HUMAN_AGENT':
          role = 'assistant';
          break;
        case 'SYSTEM':
          role = 'system';
          break;
        default:
          role = 'user';
      }

      messages.push({ role, content: msg.content });
    }

    return messages;
  }
}
