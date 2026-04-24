import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { createClient } from '@supabase/supabase-js';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../common/prisma.service.js';
import {
  WS_EVENTS,
  type WsNewMessagePayload,
  type WsConversationUpdatedPayload,
  type WsNewConversationPayload,
} from '../../common/ws-events.js';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Reuse logic từ main.ts: dev cho localhost, prod dùng CORS_ORIGINS env
      const nodeEnv = process.env.NODE_ENV || 'development';

      if (nodeEnv === 'development') {
        callback(null, true);
        return;
      }

      const allowedOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`WS CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private supabase: ReturnType<typeof createClient>;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.anonKey')!,
    );
  }

  /**
   * Xác thực JWT khi client kết nối.
   * Client phải gửi token qua: io({ auth: { token: "Bearer xxx" } })
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`WS rejected — no token [${client.id}]`);
        client.disconnect(true);
        return;
      }

      // Verify JWT qua Supabase SDK (reuse logic từ SupabaseAuthGuard)
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        this.logger.warn(`WS rejected — invalid token [${client.id}]`);
        client.disconnect(true);
        return;
      }

      // JIT: Tìm seller tương ứng
      const seller = await this.prisma.seller.findUnique({
        where: { authId: data.user.id },
      });
      if (!seller) {
        this.logger.warn(`WS rejected — seller not found [${client.id}]`);
        client.disconnect(true);
        return;
      }

      // Lưu metadata vào client.data để dùng sau
      client.data = {
        authId: data.user.id,
        email: data.user.email,
        sellerId: seller.id,
      };

      // Tìm tất cả tenant mà seller này sở hữu
      const tenants = await this.prisma.tenant.findMany({
        where: { sellerId: seller.id },
        select: { id: true },
      });

      // Join room cho từng tenant
      for (const tenant of tenants) {
        const roomName = `tenant:${tenant.id}`;
        await client.join(roomName);
        this.logger.debug(`WS [${client.id}] joined room ${roomName}`);
      }

      this.logger.log(
        `WS connected: ${data.user.email} [${client.id}] — ${tenants.length} room(s)`,
      );

      // Phản hồi client biết auth thành công
      client.emit('authenticated', {
        sellerId: seller.id,
        rooms: tenants.map((t) => `tenant:${t.id}`),
      });
    } catch (err) {
      this.logger.error(`WS connection error [${client.id}]: ${err}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = client.data as { email?: string } | undefined;
    const email = clientData?.email || 'unknown';
    this.logger.log(`WS disconnected: ${email} [${client.id}]`);
  }

  /**
   * Extract JWT token từ handshake.
   * Hỗ trợ 2 cách:
   * 1. client auth: io({ auth: { token: "Bearer xxx" } })
   * 2. query param: io({ query: { token: "Bearer xxx" } }) — fallback
   */
  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token as string | undefined;
    const queryToken = client.handshake.query?.token as string | undefined;

    const raw = authToken || queryToken;
    if (!raw) return null;

    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  }

  // ─── Event Listeners (NestJS EventEmitter → Socket.IO broadcast) ───

  @OnEvent(WS_EVENTS.NEW_MESSAGE)
  handleNewMessage(payload: WsNewMessagePayload) {
    this.server.to(`tenant:${payload.tenantId}`).emit('new_message', payload);
  }

  @OnEvent(WS_EVENTS.CONVERSATION_UPDATED)
  handleConversationUpdated(payload: WsConversationUpdatedPayload) {
    this.server
      .to(`tenant:${payload.tenantId}`)
      .emit('conversation_updated', payload);
  }

  @OnEvent(WS_EVENTS.NEW_CONVERSATION)
  handleNewConversation(payload: WsNewConversationPayload) {
    this.server
      .to(`tenant:${payload.tenantId}`)
      .emit('new_conversation', payload);
  }
}
