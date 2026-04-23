import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service.js';
import { LlmService } from '../../common/llm/llm.service.js';
import { KnowledgeSearchService } from '../knowledge/services/knowledge-search.service.js';
import { FacebookAdapter } from './adapters/facebook.adapter.js';
import type { IncomingMessage } from './adapters/channel-adapter.interface.js';
import type OpenAI from 'openai';

const HISTORY_LIMIT = 20;

/** In-memory dedup: track processed message IDs with TTL */
const processedMessages = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface AgentConfig {
  id: string;
  name: string;
  persona: string;
  model: string;
  temperature: number;
  maxTokens: number;
  greeting: string;
}

@Injectable()
export class ChannelService implements OnModuleDestroy {
  private readonly logger = new Logger(ChannelService.name);
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly knowledgeSearch: KnowledgeSearchService,
    private readonly configService: ConfigService,
    private readonly facebookAdapter: FacebookAdapter,
  ) {
    this.cleanupInterval = setInterval(() => this.cleanupDedupMap(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  // ─── Page Connect / Disconnect ────────────────────────────────

  async connectFacebookPage(
    tenantId: string,
    pageId: string,
    pageAccessToken: string,
    pageName?: string,
  ) {
    // Kiểm tra page đã được kết nối bởi tenant khác chưa
    const existing = await this.prisma.channelConnection.findUnique({
      where: {
        channelType_externalId: {
          channelType: 'FACEBOOK',
          externalId: pageId,
        },
      },
    });

    if (existing && existing.tenantId !== tenantId) {
      throw new ConflictException(
        'Facebook Page này đã được kết nối bởi cửa hàng khác',
      );
    }

    if (existing && existing.tenantId === tenantId) {
      return this.prisma.channelConnection.update({
        where: { id: existing.id },
        data: {
          accessTokenEnc: pageAccessToken,
          externalName: pageName || existing.externalName,
          isActive: true,
        },
      });
    }

    return this.prisma.channelConnection.create({
      data: {
        tenantId,
        channelType: 'FACEBOOK',
        externalId: pageId,
        externalName: pageName || `FB Page ${pageId}`,
        accessTokenEnc: pageAccessToken,
        isActive: true,
      },
    });
  }

  async disconnectFacebookPage(tenantId: string) {
    const connection = await this.prisma.channelConnection.findFirst({
      where: { tenantId, channelType: 'FACEBOOK', isActive: true },
    });

    if (!connection) {
      throw new NotFoundException(
        'Không tìm thấy kết nối Facebook cho cửa hàng này',
      );
    }

    return this.prisma.channelConnection.update({
      where: { id: connection.id },
      data: { isActive: false },
    });
  }

  async listChannels(tenantId: string) {
    return this.prisma.channelConnection.findMany({
      where: { tenantId },
      select: {
        id: true,
        channelType: true,
        externalId: true,
        externalName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Gửi tin nhắn nhân viên qua Facebook Messenger cho khách.
   * Tìm channelConversationId (FB sender ID) → gửi qua Graph API.
   */
  async sendHumanReplyToChannel(
    conversationId: string,
    content: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        channelType: true,
        channelConversationId: true,
        tenantId: true,
      },
    });

    if (!conversation?.channelType || !conversation.channelConversationId) {
      return;
    }

    if (conversation.channelType !== 'FACEBOOK') {
      this.logger.debug(
        `[HumanReply] Channel ${conversation.channelType} not yet supported for outbound`,
      );
      return;
    }

    const connection = await this.prisma.channelConnection.findFirst({
      where: {
        tenantId: conversation.tenantId,
        channelType: 'FACEBOOK',
        isActive: true,
      },
    });

    if (!connection?.accessTokenEnc) {
      this.logger.warn(
        `[HumanReply] No active FB connection for tenant ${conversation.tenantId}`,
      );
      return;
    }

    await this.facebookAdapter.sendReply(
      conversation.channelConversationId,
      content,
      connection.accessTokenEnc,
    );

    this.logger.log(
      `[HumanReply] Sent to FB user ${conversation.channelConversationId}`,
    );
  }

  // ─── Webhook Message Processing ───────────────────────────────

  /**
   * Entry point: xử lý raw FB webhook body.
   * Respond 200 ngay ở controller, method này là fire-and-forget.
   */
  processWebhookEvent(body: Record<string, unknown>): void {
    const entries = body?.entry;
    if (!Array.isArray(entries)) return;

    for (const entry of entries as Array<{ messaging?: unknown[] }>) {
      const messaging = entry?.messaging;
      if (!Array.isArray(messaging)) continue;

      for (const rawEvent of messaging) {
        const incoming = this.facebookAdapter.normalizeIncoming(rawEvent);
        if (!incoming) continue;

        if (this.isDuplicate(incoming.messageId)) {
          this.logger.debug(
            `[Dedup] Skip duplicate message: ${incoming.messageId}`,
          );
          continue;
        }

        this.handleIncomingMessage(incoming).catch((err) => {
          this.logger.error(
            `[Webhook] Failed to process message ${incoming.messageId}: ${err instanceof Error ? err.message : err}`,
          );
        });
      }
    }
  }

  /**
   * Core routing: pageId → tenant → agent → pipeline → reply
   */
  private async handleIncomingMessage(
    incoming: IncomingMessage,
  ): Promise<void> {
    const pipelineStart = Date.now();

    // Step 1: Tìm ChannelConnection theo pageId
    const connection = await this.prisma.channelConnection.findUnique({
      where: {
        channelType_externalId: {
          channelType: 'FACEBOOK',
          externalId: incoming.pageId,
        },
      },
    });

    if (!connection || !connection.isActive) {
      this.logger.warn(
        `[Routing] No active connection for page ${incoming.pageId}`,
      );
      return;
    }

    const tenantId = connection.tenantId;
    const accessToken = connection.accessTokenEnc;

    if (!accessToken) {
      this.logger.error(
        `[Routing] No access token for page ${incoming.pageId}`,
      );
      return;
    }

    // Step 2: Tìm hoặc tạo Customer theo externalId (FB sender ID)
    const customer = await this.resolveCustomer(tenantId, incoming.senderId);

    // Step 3: Lấy default agent của tenant (agent đầu tiên đang active)
    const agent = await this.prisma.agent.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!agent) {
      this.logger.error(`[Routing] No active agent for tenant ${tenantId}`);
      return;
    }

    // Step 4: Tìm hoặc tạo Conversation
    const conversation = await this.resolveConversation(
      tenantId,
      agent.id,
      customer.id,
      incoming.senderId,
    );

    // Step 5: Nếu OPEN (nhân viên đang xử lý) → lưu tin nhắn nhưng không gọi bot
    if (conversation.status === 'OPEN') {
      this.logger.log(
        `[Routing] Conversation ${conversation.id} is OPEN (human handling), skip bot reply`,
      );
      await this.saveCustomerMessage(conversation.id, incoming);
      return;
    }

    // Step 6: Lưu tin nhắn khách
    await this.saveCustomerMessage(conversation.id, incoming);

    // Step 7: Nếu không có text (sticker, ảnh...) → không gọi LLM
    if (!incoming.text) {
      this.logger.debug(
        `[Routing] Non-text message from ${incoming.senderId}, skip LLM`,
      );
      return;
    }

    // Step 8: Chạy AI pipeline (history + knowledge + LLM)
    const replyText = await this.runPipeline(
      tenantId,
      agent,
      conversation.id,
      incoming.text,
    );

    // Step 9: Gửi reply qua Facebook
    await this.facebookAdapter.sendReply(
      incoming.senderId,
      replyText,
      accessToken,
    );

    // Step 10: Lưu reply vào DB
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: replyText,
      },
    });

    // Update lastMessageAt + quota
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

    const totalMs = Date.now() - pipelineStart;
    this.logger.log(
      `[Pipeline] FB message processed: conv=${conversation.id} total=${totalMs}ms`,
    );
  }

  // ─── AI Pipeline ──────────────────────────────────────────────

  private async runPipeline(
    tenantId: string,
    agent: AgentConfig,
    conversationId: string,
    userMessage: string,
  ): Promise<string> {
    // Quota check
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { messageUsed: true, messageQuota: true },
    });

    if (tenant && tenant.messageUsed >= tenant.messageQuota) {
      return 'Xin lỗi, hệ thống đã hết quota tin nhắn. Vui lòng liên hệ chủ shop.';
    }

    // Load history
    const recentHistory = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });
    const history = recentHistory.reverse();

    // Knowledge search (graceful fallback)
    let knowledgeContext: string | null = null;
    try {
      knowledgeContext = await this.knowledgeSearch.buildKnowledgeContext(
        tenantId,
        userMessage,
      );
    } catch (error) {
      this.logger.warn(
        `Knowledge search failed (non-fatal): ${error instanceof Error ? error.message : error}`,
      );
    }

    // Build LLM messages
    const llmMessages = this.buildLlmMessages(agent, history, knowledgeContext);

    // Call LLM
    try {
      const completion = await this.llm.chat(llmMessages, {
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      });

      return completion.choices[0]?.message?.content ?? agent.greeting;
    } catch (error) {
      this.logger.error(
        `[Pipeline] LLM call failed: ${error instanceof Error ? error.message : error}`,
      );
      return 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private async resolveCustomer(tenantId: string, fbSenderId: string) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_externalId: { tenantId, externalId: fbSenderId },
      },
    });

    if (existing) return existing;

    return this.prisma.customer.create({
      data: {
        tenantId,
        externalId: fbSenderId,
        name: `FB User ${fbSenderId.slice(-4)}`,
      },
    });
  }

  private async resolveConversation(
    tenantId: string,
    agentId: string,
    customerId: string,
    fbSenderId: string,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        customerId,
        channelType: 'FACEBOOK',
        status: { not: 'RESOLVED' },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        tenantId,
        agentId,
        customerId,
        channelType: 'FACEBOOK',
        channelConversationId: fbSenderId,
        status: 'BOT_HANDLING',
        lastMessageAt: new Date(),
      },
    });
  }

  private async saveCustomerMessage(
    conversationId: string,
    incoming: IncomingMessage,
  ) {
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'CUSTOMER',
        content: incoming.text,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
  }

  private buildLlmMessages(
    agent: { persona: string },
    history: { role: string; content: string | null }[],
    knowledgeContext?: string | null,
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    let systemPrompt = agent.persona;

    if (knowledgeContext) {
      systemPrompt +=
        `\n\n<knowledge>\nThông tin sản phẩm/dịch vụ liên quan (chỉ tham khảo, KHÔNG bịa thêm):\n---\n${knowledgeContext}\n</knowledge>` +
        `\n\nQuy tắc:\n- Ưu tiên trả lời dựa trên thông tin trong <knowledge> nếu có.` +
        `\n- Nếu không tìm thấy câu trả lời cụ thể trong knowledge, hãy trả lời bằng kiến thức chung.` +
        `\n- Luôn giữ đúng giọng nói và phong cách trong persona.`;
    }

    messages.push({ role: 'system', content: systemPrompt });

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

  // ─── Deduplication ────────────────────────────────────────────

  private isDuplicate(messageId: string): boolean {
    if (processedMessages.has(messageId)) return true;
    processedMessages.set(messageId, Date.now());
    return false;
  }

  private cleanupDedupMap(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, ts] of processedMessages) {
      if (now - ts > DEDUP_TTL_MS) {
        processedMessages.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`[Dedup] Cleaned ${cleaned} expired entries`);
    }
  }
}
