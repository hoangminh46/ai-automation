import { Injectable, Logger } from '@nestjs/common';
import type {
  ChannelAdapter,
  IncomingMessage,
} from './channel-adapter.interface.js';

const FB_GRAPH_API = 'https://graph.facebook.com/v21.0';

/** Raw FB messaging event structure */
interface FbMessagingEvent {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
}

@Injectable()
export class FacebookAdapter implements ChannelAdapter {
  readonly channelType = 'FACEBOOK' as const;
  private readonly logger = new Logger(FacebookAdapter.name);

  /**
   * Normalize raw FB messaging event → IncomingMessage.
   * Returns null nếu event không phải text message (deliveries, reads, postbacks...).
   */
  normalizeIncoming(rawEvent: unknown): IncomingMessage | null {
    const event = rawEvent as FbMessagingEvent;

    const senderId = event?.sender?.id;
    const recipientId = event?.recipient?.id;
    const messageObj = event?.message;

    if (!senderId || !recipientId || !messageObj) return null;

    // Bỏ qua echo messages (tin nhắn do chính page gửi đi)
    if (messageObj.is_echo) return null;

    return {
      senderId,
      pageId: recipientId,
      messageId: messageObj.mid || `fb-${Date.now()}`,
      text: messageObj.text || null,
      timestamp: event.timestamp || Date.now(),
    };
  }

  /**
   * Gửi text reply qua Facebook Graph API Send API.
   */
  async sendReply(
    recipientId: string,
    message: string,
    accessToken: string,
  ): Promise<void> {
    const url = `${FB_GRAPH_API}/me/messages`;

    const body = {
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: 'RESPONSE',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `[SendReply] Failed to send message to ${recipientId}: ${response.status} ${errorBody}`,
      );
      throw new Error(`Facebook Send API error: ${response.status}`);
    }

    this.logger.log(`[SendReply] Message sent to ${recipientId}`);
  }
}
