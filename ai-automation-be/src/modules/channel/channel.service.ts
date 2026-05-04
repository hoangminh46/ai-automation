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
import { ZaloAdapter } from './adapters/zalo.adapter.js';
import { ZaloTokenService } from './services/zalo-token.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WS_EVENTS } from '../../common/ws-events.js';
import {
  encryptToken,
  decryptToken,
  createSignedState,
  verifySignedState,
} from '../../common/crypto.util.js';
import type { IncomingMessage } from './adapters/channel-adapter.interface.js';
import type OpenAI from 'openai';

const HISTORY_LIMIT = 20;

/** In-memory dedup: track processed message IDs with TTL */
const processedMessages = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Pending FB page selections: sessionId → { tenantId, pages, longLivedToken, expiresAt } */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface PendingPageSession {
  tenantId: string;
  pages: FacebookPage[];
  expiresAt: number;
}

const pendingPageSessions = new Map<string, PendingPageSession>();
const PAGE_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
    private readonly zaloAdapter: ZaloAdapter,
    private readonly zaloTokenService: ZaloTokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.cleanupInterval = setInterval(() => {
      this.cleanupDedupMap();
      this.cleanupPendingPageSessions();
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }
  // ─── Facebook OAuth ────────────────────────────────────────────

  /**
   * Tạo Facebook OAuth URL để FE redirect seller đi authorize.
   */
  getFacebookAuthUrl(tenantId: string): string {
    const appId = this.configService.get<string>('facebook.appId');
    const baseUrl =
      this.configService.get<string>('app.baseUrl') ||
      `http://localhost:${this.configService.get<number>('app.port', 3001)}`;

    const redirectUri = `${baseUrl}/api/v1/channels/facebook/callback`;

    const signedState = createSignedState(tenantId, appId || '');

    const params = new URLSearchParams({
      client_id: appId || '',
      redirect_uri: redirectUri,
      scope: 'pages_show_list,pages_messaging,pages_manage_metadata',
      response_type: 'code',
      state: signedState,
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * OAuth callback: exchange code → User Token → Long-lived Token → Page Token → store.
   */
  async handleFacebookCallback(
    rawState: string,
    code: string,
  ): Promise<{
    pageName: string | null;
    tenantId: string;
    pages: { id: string; name: string }[] | null;
    sessionId: string | null;
  }> {
    const appId = this.configService.get<string>('facebook.appId');
    const appSecret = this.configService.get<string>('facebook.appSecret');

    // Verify signed state → extract tenantId
    const tenantId = verifySignedState(rawState, appId || '');

    const baseUrl =
      this.configService.get<string>('app.baseUrl') ||
      `http://localhost:${this.configService.get<number>('app.port', 3001)}`;
    const redirectUri = `${baseUrl}/api/v1/channels/facebook/callback`;

    // Step 1: Exchange code → short-lived User Access Token
    const tokenUrl = new URL(
      'https://graph.facebook.com/v21.0/oauth/access_token',
    );
    tokenUrl.searchParams.set('client_id', appId || '');
    tokenUrl.searchParams.set('client_secret', appSecret || '');
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      this.logger.error(`[FBOAuth] Token exchange failed: ${errBody}`);
      throw new Error('Facebook token exchange failed');
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const shortToken = tokenData.access_token;
    if (!shortToken) {
      throw new Error('No access_token in Facebook response');
    }

    // Step 2: Exchange short-lived → long-lived User Token (60 days)
    const longUrl = new URL(
      'https://graph.facebook.com/v21.0/oauth/access_token',
    );
    longUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longUrl.searchParams.set('client_id', appId || '');
    longUrl.searchParams.set('client_secret', appSecret || '');
    longUrl.searchParams.set('fb_exchange_token', shortToken);

    const longRes = await fetch(longUrl.toString());
    const longData = (await longRes.json()) as { access_token?: string };
    // Fallback: nếu exchange fail → dùng short token
    const longLivedUserToken = longData.access_token || shortToken;

    // Step 3: Get Pages list
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`;
    const pagesRes = await fetch(pagesUrl);
    if (!pagesRes.ok) {
      const errBody = await pagesRes.text();
      this.logger.error(`[FBOAuth] Get pages failed: ${errBody}`);
      throw new Error('Cannot retrieve Facebook Pages');
    }

    const pagesData = (await pagesRes.json()) as {
      data?: Array<{
        id: string;
        name: string;
        access_token: string;
      }>;
    };

    const pages = pagesData.data || [];
    if (pages.length === 0) {
      throw new Error(
        'Không tìm thấy Facebook Page nào. Vui lòng đảm bảo bạn quản lý ít nhất 1 Page.',
      );
    }

    // Step 4: Nếu chỉ có 1 Page → auto-connect. Nếu nhiều → trả về để user chọn.
    if (pages.length === 1) {
      const selectedPage = pages[0];
      await this.subscribeAndConnectPage(
        tenantId,
        selectedPage.id,
        selectedPage.name,
        selectedPage.access_token,
      );

      return {
        pageName: selectedPage.name,
        tenantId,
        pages: null,
        sessionId: null,
      };
    }

    // Multi-page: lưu session tạm → FE hiện UI chọn
    const { randomBytes } = await import('crypto');
    const sessionId = randomBytes(16).toString('hex');
    pendingPageSessions.set(sessionId, {
      tenantId,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
      })),
      expiresAt: Date.now() + PAGE_SESSION_TTL_MS,
    });

    this.logger.log(
      `[FBOAuth] Multiple pages (${pages.length}) for tenant ${tenantId}, session=${sessionId}`,
    );

    return {
      pageName: null,
      tenantId,
      pages: pages.map((p) => ({ id: p.id, name: p.name })),
      sessionId,
    };
  }

  /**
   * Subscribe webhook + connect Page (dùng chung cho cả auto-connect và select-page).
   */
  private async subscribeAndConnectPage(
    tenantId: string,
    pageId: string,
    pageName: string,
    pageAccessToken: string,
  ): Promise<void> {
    // Auto-subscribe webhook cho Page
    try {
      const subUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
      const subRes = await fetch(subUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: 'messages,messaging_postbacks',
          access_token: pageAccessToken,
        }),
      });
      if (!subRes.ok) {
        const errBody = await subRes.text();
        this.logger.warn(
          `[FBOAuth] Webhook subscribe failed (non-blocking): ${errBody}`,
        );
      } else {
        this.logger.log(`[FBOAuth] Webhook subscribed for Page ${pageId}`);
      }
    } catch (err) {
      this.logger.warn(
        `[FBOAuth] Webhook subscribe error: ${err instanceof Error ? err.message : err}`,
      );
    }

    await this.connectFacebookPage(tenantId, pageId, pageAccessToken, pageName);

    this.logger.log(
      `[FBOAuth] Connected Page "${pageName}" (${pageId}) for tenant ${tenantId}`,
    );
  }

  /**
   * Lấy danh sách Pages đang chờ user chọn.
   */
  getPendingPages(
    sessionId: string,
    tenantId: string,
  ): { id: string; name: string }[] {
    const session = pendingPageSessions.get(sessionId);
    if (!session || session.tenantId !== tenantId) {
      throw new NotFoundException(
        'Phiên chọn Page không tồn tại hoặc đã hết hạn',
      );
    }
    if (Date.now() > session.expiresAt) {
      pendingPageSessions.delete(sessionId);
      throw new NotFoundException('Phiên chọn Page đã hết hạn');
    }
    return session.pages.map((p) => ({ id: p.id, name: p.name }));
  }

  /**
   * User chọn Page từ danh sách → connect.
   */
  async selectFacebookPage(
    sessionId: string,
    pageId: string,
    tenantId: string,
  ): Promise<{ pageName: string }> {
    const session = pendingPageSessions.get(sessionId);
    if (!session || session.tenantId !== tenantId) {
      throw new NotFoundException(
        'Phiên chọn Page không tồn tại hoặc đã hết hạn',
      );
    }
    if (Date.now() > session.expiresAt) {
      pendingPageSessions.delete(sessionId);
      throw new NotFoundException('Phiên chọn Page đã hết hạn');
    }

    const selectedPage = session.pages.find((p) => p.id === pageId);
    if (!selectedPage) {
      throw new NotFoundException('Page ID không hợp lệ');
    }

    await this.subscribeAndConnectPage(
      tenantId,
      selectedPage.id,
      selectedPage.name,
      selectedPage.access_token,
    );

    pendingPageSessions.delete(sessionId);

    return { pageName: selectedPage.name };
  }

  // ─── Page Connect / Disconnect (legacy + internal) ────────────

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
          accessTokenEnc: encryptToken(pageAccessToken),
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
        accessTokenEnc: encryptToken(pageAccessToken),
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

    // Unsubscribe webhook (non-blocking)
    if (connection.accessTokenEnc) {
      try {
        const token = decryptToken(connection.accessTokenEnc);
        const unsubUrl = `https://graph.facebook.com/v21.0/${connection.externalId}/subscribed_apps?access_token=${token}`;
        const unsubRes = await fetch(unsubUrl, { method: 'DELETE' });
        if (unsubRes.ok) {
          this.logger.log(
            `[Disconnect] Unsubscribed webhook for Page ${connection.externalId}`,
          );
        } else {
          this.logger.warn(
            `[Disconnect] Webhook unsubscribe failed: ${await unsubRes.text()}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `[Disconnect] Webhook unsubscribe error: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return this.prisma.channelConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        accessTokenEnc: null,
        refreshTokenEnc: null,
      },
    });
  }

  // ─── Zalo OA Connect / Disconnect ─────────────────────────────

  /**
   * Tạo Zalo OAuth URL để FE redirect seller đi authorize.
   */
  getZaloAuthUrl(tenantId: string): string {
    const appId = this.configService.get<string>('zalo.appId');
    const baseUrl =
      this.configService.get<string>('app.baseUrl') ||
      `http://localhost:${this.configService.get<number>('app.port', 3001)}`;

    const redirectUri = `${baseUrl}/api/v1/channels/zalo/callback`;

    const signedState = createSignedState(tenantId, appId || '');

    const params = new URLSearchParams({
      app_id: appId || '',
      redirect_uri: redirectUri,
      state: signedState,
    });

    return `https://permission.zalo.me/v3/permission?${params.toString()}`;
  }

  /**
   * OAuth callback: exchange authorization code → tokens → store.
   * Gọi Zalo API lấy OA info rồi lưu ChannelConnection.
   */
  async handleZaloCallback(
    rawState: string,
    code: string,
  ): Promise<{ oaName: string; tenantId: string }> {
    const appId = this.configService.get<string>('zalo.appId');
    const tenantId = verifySignedState(rawState, appId || '');
    // Step 1: Exchange code → tokens
    const tokenData = await this.zaloTokenService.exchangeCodeForTokens(code);

    const accessToken = tokenData.access_token || '';
    const refreshToken = tokenData.refresh_token || '';
    const expiresIn = parseInt(tokenData.expires_in || '3600', 10);

    // Step 2: Get OA info
    const oaInfo = await this.getZaloOaInfo(accessToken);
    const oaId = oaInfo.oa_id || '';
    const oaName = oaInfo.name || `Zalo OA ${oaId.slice(-4)}`;

    if (!oaId) {
      throw new Error('Cannot retrieve Zalo OA ID');
    }

    // Step 3: Upsert ChannelConnection
    await this.connectZaloOA(
      tenantId,
      oaId,
      oaName,
      accessToken,
      refreshToken,
      expiresIn,
    );

    this.logger.log(
      `[ZaloOAuth] Connected OA "${oaName}" (${oaId}) for tenant ${tenantId}`,
    );

    return { oaName, tenantId };
  }

  /**
   * Lưu/update ChannelConnection cho Zalo OA.
   */
  private async connectZaloOA(
    tenantId: string,
    oaId: string,
    oaName: string,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ) {
    const existing = await this.prisma.channelConnection.findUnique({
      where: {
        channelType_externalId: {
          channelType: 'ZALO',
          externalId: oaId,
        },
      },
    });

    if (existing && existing.tenantId !== tenantId) {
      throw new ConflictException(
        'Zalo OA này đã được kết nối bởi cửa hàng khác',
      );
    }

    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    if (existing) {
      return this.prisma.channelConnection.update({
        where: { id: existing.id },
        data: {
          accessTokenEnc: encryptToken(accessToken),
          refreshTokenEnc: encryptToken(refreshToken),
          tokenExpiresAt,
          externalName: oaName,
          isActive: true,
        },
      });
    }

    return this.prisma.channelConnection.create({
      data: {
        tenantId,
        channelType: 'ZALO',
        externalId: oaId,
        externalName: oaName,
        accessTokenEnc: encryptToken(accessToken),
        refreshTokenEnc: encryptToken(refreshToken),
        tokenExpiresAt,
        isActive: true,
      },
    });
  }

  async disconnectZaloOA(tenantId: string) {
    const connection = await this.prisma.channelConnection.findFirst({
      where: { tenantId, channelType: 'ZALO', isActive: true },
    });

    if (!connection) {
      throw new NotFoundException(
        'Không tìm thấy kết nối Zalo OA cho cửa hàng này',
      );
    }

    return this.prisma.channelConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        accessTokenEnc: null,
        refreshTokenEnc: null,
      },
    });
  }

  /**
   * Gọi Zalo API lấy thông tin OA (oa_id, name, avatar).
   */
  private async getZaloOaInfo(
    accessToken: string,
  ): Promise<{ oa_id?: string; name?: string }> {
    const response = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
      method: 'GET',
      headers: { access_token: accessToken },
    });

    if (!response.ok) {
      this.logger.error(`[GetOA] HTTP ${response.status}`);
      throw new Error(`Zalo GetOA API error: ${response.status}`);
    }

    const result = (await response.json()) as {
      error?: number;
      message?: string;
      data?: { oa_id?: string; name?: string };
    };

    if (result.error && result.error !== 0) {
      this.logger.error(
        `[GetOA] Zalo error: ${result.error} - ${result.message}`,
      );
      throw new Error(`Zalo GetOA error: ${result.error}`);
    }

    return result.data || {};
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
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Gửi tin nhắn nhân viên qua channel (Facebook/Zalo) cho khách.
   * Tìm channelConversationId → gửi qua adapter tương ứng.
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

    const channelType = conversation.channelType as 'FACEBOOK' | 'ZALO';

    if (channelType !== 'FACEBOOK' && channelType !== 'ZALO') {
      this.logger.debug(
        `[HumanReply] Channel ${conversation.channelType} not yet supported for outbound`,
      );
      return;
    }

    const connection = await this.prisma.channelConnection.findFirst({
      where: {
        tenantId: conversation.tenantId,
        channelType,
        isActive: true,
      },
    });

    if (!connection?.accessTokenEnc) {
      this.logger.warn(
        `[HumanReply] No active ${channelType} connection for tenant ${conversation.tenantId}`,
      );
      return;
    }

    if (channelType === 'ZALO') {
      const validToken = await this.ensureValidZaloToken(connection);
      if (!validToken) {
        this.logger.error(
          `[HumanReply] Zalo token invalid for tenant ${conversation.tenantId}`,
        );
        return;
      }
      await this.zaloAdapter.sendReply(
        conversation.channelConversationId,
        content,
        validToken,
      );
    } else {
      await this.facebookAdapter.sendReply(
        conversation.channelConversationId,
        content,
        decryptToken(connection.accessTokenEnc),
      );
    }

    this.logger.log(
      `[HumanReply] Sent to ${channelType} user ${conversation.channelConversationId}`,
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

        this.handleIncomingMessage(incoming, 'FACEBOOK').catch((err) => {
          this.logger.error(
            `[Webhook] Failed to process message ${incoming.messageId}: ${err instanceof Error ? err.message : err}`,
          );
        });
      }
    }
  }

  /**
   * Entry point: xử lý raw Zalo webhook event.
   */
  processZaloWebhookEvent(body: Record<string, unknown>): void {
    const incoming = this.zaloAdapter.normalizeIncoming(body);
    if (!incoming) return;

    if (this.isDuplicate(incoming.messageId)) {
      this.logger.debug(
        `[Dedup] Skip duplicate Zalo message: ${incoming.messageId}`,
      );
      return;
    }

    this.handleIncomingMessage(incoming, 'ZALO').catch((err) => {
      this.logger.error(
        `[ZaloWebhook] Failed to process message ${incoming.messageId}: ${err instanceof Error ? err.message : err}`,
      );
    });
  }

  /**
   * Core routing: pageId → tenant → agent → pipeline → reply
   */
  private async handleIncomingMessage(
    incoming: IncomingMessage,
    channelType: 'FACEBOOK' | 'ZALO',
  ): Promise<void> {
    const pipelineStart = Date.now();

    // Step 1: Tìm ChannelConnection theo pageId (FB) hoặc OA ID (Zalo)
    const connection = await this.prisma.channelConnection.findUnique({
      where: {
        channelType_externalId: {
          channelType,
          externalId: incoming.pageId,
        },
      },
    });

    if (!connection || !connection.isActive) {
      this.logger.warn(
        `[Routing] No active ${channelType} connection for ${incoming.pageId}`,
      );
      return;
    }

    const tenantId = connection.tenantId;

    // Step 2: Lấy access token (Zalo cần check expiry + refresh)
    let accessToken = connection.accessTokenEnc
      ? decryptToken(connection.accessTokenEnc)
      : null;
    if (channelType === 'ZALO') {
      accessToken = await this.ensureValidZaloToken(connection);
    }

    if (!accessToken) {
      this.logger.error(
        `[Routing] No access token for ${channelType} ${incoming.pageId}`,
      );
      return;
    }

    // Step 3: Tìm hoặc tạo Customer
    const customerName =
      channelType === 'ZALO'
        ? `Zalo User ${incoming.senderId.slice(-4)}`
        : `FB User ${incoming.senderId.slice(-4)}`;
    const customer = await this.resolveCustomer(
      tenantId,
      incoming.senderId,
      customerName,
    );

    // Step 4: Lấy default agent
    const agent = await this.prisma.agent.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!agent) {
      this.logger.error(`[Routing] No active agent for tenant ${tenantId}`);
      return;
    }

    // Step 5: Tìm hoặc tạo Conversation
    const conversation = await this.resolveConversation(
      tenantId,
      agent.id,
      customer.id,
      incoming.senderId,
      channelType,
    );

    // Step 6: Nếu OPEN → lưu tin nhắn nhưng không gọi bot
    if (conversation.status === 'OPEN') {
      this.logger.log(
        `[Routing] Conversation ${conversation.id} is OPEN, skip bot reply`,
      );
      await this.saveCustomerMessage(tenantId, conversation.id, incoming);
      return;
    }

    // Step 7: Lưu tin nhắn khách
    await this.saveCustomerMessage(tenantId, conversation.id, incoming);

    // Step 8: Nếu không có text → không gọi LLM
    if (!incoming.text) {
      this.logger.debug(
        `[Routing] Non-text message from ${incoming.senderId}, skip LLM`,
      );
      return;
    }

    // Step 9: Chạy AI pipeline
    const replyText = await this.runPipeline(
      tenantId,
      agent,
      conversation.id,
      incoming.text,
    );

    // Step 10: Gửi reply qua channel adapter
    if (channelType === 'ZALO') {
      await this.zaloAdapter.sendReply(
        incoming.senderId,
        replyText,
        accessToken,
      );
    } else {
      await this.facebookAdapter.sendReply(
        incoming.senderId,
        replyText,
        accessToken,
      );
    }

    // Step 11: Lưu reply + update quota
    const botMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: replyText,
      },
    });

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

    // Emit WS: bot reply
    this.eventEmitter.emit(WS_EVENTS.NEW_MESSAGE, {
      tenantId,
      conversationId: conversation.id,
      message: {
        id: botMessage.id,
        conversationId: conversation.id,
        role: botMessage.role,
        content: botMessage.content,
        createdAt: botMessage.createdAt,
      },
    });

    const totalMs = Date.now() - pipelineStart;
    this.logger.log(
      `[Pipeline] ${channelType} message processed: conv=${conversation.id} total=${totalMs}ms`,
    );
  }

  /**
   * Check Zalo token expiry, refresh nếu sắp hết hạn.
   */
  private async ensureValidZaloToken(connection: {
    id: string;
    accessTokenEnc: string | null;
    tokenExpiresAt: Date | null;
  }): Promise<string | null> {
    if (!connection.accessTokenEnc) return null;

    const bufferMs = 5 * 60 * 1000;
    const isExpiring =
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() < Date.now() + bufferMs;

    if (isExpiring) {
      this.logger.log(
        `[TokenCheck] Refreshing Zalo token for ${connection.id}`,
      );
      try {
        return await this.zaloTokenService.refreshTokenForConnection(
          connection.id,
        );
      } catch (err) {
        this.logger.error(
          `[TokenCheck] Refresh failed: ${err instanceof Error ? err.message : err}`,
        );
        return decryptToken(connection.accessTokenEnc);
      }
    }

    return decryptToken(connection.accessTokenEnc);
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

  private async resolveCustomer(
    tenantId: string,
    externalId: string,
    defaultName?: string,
  ) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_externalId: { tenantId, externalId },
      },
    });

    if (existing) return existing;

    return this.prisma.customer.create({
      data: {
        tenantId,
        externalId,
        name: defaultName || `User ${externalId.slice(-4)}`,
      },
    });
  }

  private async resolveConversation(
    tenantId: string,
    agentId: string,
    customerId: string,
    channelSenderId: string,
    channelType: 'FACEBOOK' | 'ZALO' = 'FACEBOOK',
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        customerId,
        channelType,
        status: { not: 'RESOLVED' },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) return existing;

    const newConversation = await this.prisma.conversation.create({
      data: {
        tenantId,
        agentId,
        customerId,
        channelType,
        channelConversationId: channelSenderId,
        status: 'BOT_HANDLING',
        lastMessageAt: new Date(),
      },
    });

    // Emit WS: new conversation
    this.eventEmitter.emit(WS_EVENTS.NEW_CONVERSATION, {
      tenantId,
      conversation: {
        id: newConversation.id,
        tenantId: newConversation.tenantId,
        agentId: newConversation.agentId,
        customerId: newConversation.customerId,
        status: newConversation.status,
        channelType: newConversation.channelType,
        lastMessageAt: newConversation.lastMessageAt,
        createdAt: newConversation.createdAt,
      },
    });

    return newConversation;
  }

  private async saveCustomerMessage(
    tenantId: string,
    conversationId: string,
    incoming: IncomingMessage,
  ) {
    const now = new Date();

    const customerMsg = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'CUSTOMER',
        content: incoming.text,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    // Emit WS: customer message
    this.eventEmitter.emit(WS_EVENTS.NEW_MESSAGE, {
      tenantId,
      conversationId,
      message: {
        id: customerMsg.id,
        conversationId,
        role: customerMsg.role,
        content: customerMsg.content,
        createdAt: customerMsg.createdAt,
      },
    });

    // Emit WS: lastMessageAt updated
    this.eventEmitter.emit(WS_EVENTS.CONVERSATION_UPDATED, {
      tenantId,
      conversationId,
      status: null,
      lastMessageAt: now,
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

  private cleanupPendingPageSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, session] of pendingPageSessions) {
      if (now > session.expiresAt) {
        pendingPageSessions.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`[PageSession] Cleaned ${cleaned} expired sessions`);
    }
  }
}
