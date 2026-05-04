import { Injectable, Logger } from '@nestjs/common';
import type {
  ChannelAdapter,
  IncomingMessage,
} from './channel-adapter.interface.js';

const ZALO_OA_API = 'https://openapi.zalo.me/v3.0/oa/message/cs';

/**
 * Raw Zalo OA webhook event structure (user_send_text).
 * Zalo gửi POST tới webhook URL khi user nhắn tin.
 */
interface ZaloWebhookEvent {
  app_id?: string;
  user_id_by_app?: string;
  sender?: { id?: string };
  recipient?: { id?: string };
  event_name?: string;
  message?: {
    text?: string;
    msg_id?: string;
  };
  timestamp?: string;
}

@Injectable()
export class ZaloAdapter implements ChannelAdapter {
  readonly channelType = 'ZALO' as const;
  private readonly logger = new Logger(ZaloAdapter.name);

  /**
   * Normalize raw Zalo webhook event → IncomingMessage.
   * Returns null nếu event không phải user_send_text hoặc thiếu data.
   */
  normalizeIncoming(rawEvent: unknown): IncomingMessage | null {
    const event = rawEvent as ZaloWebhookEvent;

    if (event?.event_name !== 'user_send_text') {
      return null;
    }

    const senderId = event?.sender?.id;
    const recipientId = event?.recipient?.id;
    const messageObj = event?.message;

    if (!senderId || !recipientId || !messageObj) return null;

    return {
      senderId,
      pageId: recipientId,
      messageId: messageObj.msg_id || `zalo-${Date.now()}`,
      text: messageObj.text || null,
      timestamp: event.timestamp ? parseInt(event.timestamp, 10) : Date.now(),
    };
  }

  /**
   * Gửi text reply qua Zalo OA API (Customer Service message).
   * Zalo dùng header `access_token` riêng thay vì `Authorization: Bearer`.
   */
  async sendReply(
    recipientId: string,
    message: string,
    accessToken: string,
  ): Promise<void> {
    const body = {
      recipient: { user_id: recipientId },
      message: { text: message },
    };

    const response = await fetch(ZALO_OA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: accessToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `[SendReply] Failed to send message to ${recipientId}: ${response.status} ${errorBody}`,
      );
      throw new Error(`Zalo OA API error: ${response.status}`);
    }

    // Zalo trả JSON { error: 0, message: "Success" } khi thành công
    const result = (await response.json()) as {
      error?: number;
      message?: string;
    };
    if (result.error !== 0) {
      this.logger.error(
        `[SendReply] Zalo API returned error: ${result.error} - ${result.message}`,
      );
      throw new Error(`Zalo OA API error: ${result.error} - ${result.message}`);
    }

    this.logger.log(`[SendReply] Message sent to Zalo user ${recipientId}`);
  }
}
