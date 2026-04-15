import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { LlmService } from '../../common/llm/llm.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TestChatDto } from './dto/test-chat.dto.js';
import { ChatResponseDto } from './dto/chat-response.dto.js';
import type OpenAI from 'openai';

const HISTORY_LIMIT = 20;

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
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
    await this.verifyTenantAccess(tenantId, sellerId);

    // Step 1: Load agent
    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, tenantId, isActive: true },
    });
    if (!agent) {
      throw new NotFoundException('Bot không tồn tại hoặc đã bị vô hiệu hóa');
    }

    // Step 2: Resolve or create customer
    const customer = await this.resolveCustomer(tenantId, dto);

    // Step 3: Resolve or create conversation
    const conversation = await this.resolveConversation(
      tenantId,
      agent.id,
      customer.id,
      dto.conversationId,
    );

    // Step 4: Save customer message to DB
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'CUSTOMER',
        content: dto.message,
      },
    });

    // Step 5: Load LAST N messages for context (desc → take → reverse to chronological)
    const recentHistory = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });
    const history = recentHistory.reverse();

    // Step 6: Build message array for LLM
    const llmMessages = this.buildLlmMessages(agent, history);

    // Step 7: Call LLM (with error handling for Gemini failures)
    let replyContent: string;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
      this.logger.log(
        `Calling LLM for agent="${agent.name}" conversation=${conversation.id} (${llmMessages.length} messages)`,
      );

      const completion = await this.llm.chat(llmMessages, {
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      });

      replyContent = completion.choices[0]?.message?.content ?? agent.greeting;
      promptTokens = completion.usage?.prompt_tokens ?? 0;
      completionTokens = completion.usage?.completion_tokens ?? 0;
      totalTokens = completion.usage?.total_tokens ?? 0;

      this.logger.log(`LLM reply received: ${totalTokens} tokens used`);
    } catch (error) {
      this.logger.error(
        `LLM call failed for conversation=${conversation.id}: ${error instanceof Error ? error.message : error}`,
      );
      throw new InternalServerErrorException(
        'Bot hiện không thể trả lời. Vui lòng thử lại sau.',
      );
    }

    // Step 8: Save assistant reply to DB with token tracking
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: replyContent,
        promptTokens: promptTokens || null,
        completionTokens: completionTokens || null,
      },
    });

    // Step 9: Update conversation lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

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
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // System prompt = agent persona
    messages.push({ role: 'system', content: agent.persona });

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
