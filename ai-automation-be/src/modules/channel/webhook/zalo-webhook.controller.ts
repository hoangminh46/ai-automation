import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ChannelService } from '../channel.service.js';
import { createHash } from 'crypto';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

/**
 * PUBLIC controller — không dùng Auth Guard.
 * Zalo gọi trực tiếp vào đây khi có event mới.
 */
@ApiTags('Webhook')
@Controller('webhook/zalo')
export class ZaloWebhookController {
  private readonly logger = new Logger(ZaloWebhookController.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /webhook/zalo
   * Zalo gửi event khi user nhắn tin cho OA.
   * Verify signature → respond 200 → process async.
   */
  @ApiExcludeEndpoint()
  @Post()
  handleWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const body = req.body as Record<string, unknown>;

    // Step 1: Verify X-ZEvent-Signature
    const signature = req.headers['x-zevent-signature'] as string | undefined;
    const timestamp = req.headers['timestamp'] as string | undefined;
    const appId = (body?.app_id as string) || '';

    if (!this.verifySignature(appId, req.rawBody, timestamp, signature)) {
      this.logger.warn('[Webhook] Invalid Zalo signature — rejecting');
      return res.status(403).send('Invalid signature');
    }

    // Step 2: Respond 200 IMMEDIATELY (Zalo cũng cần response nhanh)
    res.status(200).send('EVENT_RECEIVED');

    // Step 3: Process async (fire-and-forget)
    this.channelService.processZaloWebhookEvent(body);
  }

  /**
   * Verify Zalo webhook signature.
   * X-ZEvent-Signature = hex(sha256(appId + data + timestamp + OASecretKey))
   *
   * "data" là raw body string (byte-exact, không qua JSON.parse → stringify).
   */
  private verifySignature(
    appId: string,
    rawBody: Buffer | undefined,
    timestamp: string | undefined,
    signature: string | undefined,
  ): boolean {
    const oaSecretKey = this.configService.get<string>('zalo.oaSecretKey');

    if (!oaSecretKey) {
      this.logger.warn(
        '[Signature] ZALO_OA_SECRET_KEY not configured, skipping verification',
      );
      return true;
    }

    if (!signature || !timestamp || !rawBody) {
      return false;
    }

    const data = rawBody.toString('utf8');
    const payload = appId + data + timestamp + oaSecretKey;
    const expectedSig = createHash('sha256').update(payload).digest('hex');

    return signature === expectedSig;
  }
}
