import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket Gateway cho real-time notifications.
 *
 * Authentication: Client gửi JWT trong handshake query → Gateway verify
 * bằng Supabase Admin → join room `seller:{sellerId}`.
 *
 * Các service khác inject NotificationGateway để emit events tới seller.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly supabaseUrl: string;
  private readonly supabaseServiceKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    this.supabaseServiceKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
  }

  /**
   * Client kết nối → verify JWT → join seller room.
   * Handshake: io('/notifications', { query: { token: 'jwt...' } })
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const queryToken = client.handshake.query.token;
      const authToken = client.handshake.auth?.token as string | undefined;
      const token =
        (typeof queryToken === 'string' ? queryToken : undefined) || authToken;

      if (!token) {
        this.logger.warn(`[WS] Connection rejected: no token. id=${client.id}`);
        client.disconnect();
        return;
      }

      const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        this.logger.warn(
          `[WS] Connection rejected: invalid token. id=${client.id}`,
        );
        client.disconnect();
        return;
      }

      // Lưu authId vào socket data, join room
      const authId: string = user.id;
      (client.data as Record<string, unknown>).authId = authId;
      void client.join(`auth:${authId}`);

      this.logger.log(`[WS] Connected: id=${client.id} authId=${authId}`);
    } catch {
      this.logger.error(`[WS] Connection error: id=${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`[WS] Disconnected: id=${client.id}`);
  }

  /**
   * Emit event tới seller qua authId.
   * Room name = `auth:{supabaseUserId}`
   */
  emitToSeller(authId: string, event: string, payload: unknown): void {
    this.server.to(`auth:${authId}`).emit(event, payload);
    this.logger.debug(`[WS] Emitted "${event}" to auth:${authId}`);
  }
}
