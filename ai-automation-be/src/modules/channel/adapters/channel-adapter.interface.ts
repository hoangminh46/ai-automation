/**
 * Reusable interface cho mọi kênh (Facebook, Zalo, Widget).
 * Mỗi adapter normalize raw event → IncomingMessage chuẩn, và gửi reply ngược lại.
 */

export interface IncomingMessage {
  senderId: string;
  pageId: string;
  messageId: string;
  text: string | null;
  timestamp: number;
}

export interface ChannelAdapter {
  readonly channelType: 'FACEBOOK' | 'ZALO' | 'WIDGET';

  /** Parse raw webhook event thành IncomingMessage chuẩn */
  normalizeIncoming(rawEvent: unknown): IncomingMessage | null;

  /** Gửi reply qua channel API */
  sendReply(
    recipientId: string,
    message: string,
    accessToken: string,
  ): Promise<void>;
}
