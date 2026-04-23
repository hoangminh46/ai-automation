import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ChannelService } from '../channel.service.js';
import { createHmac, timingSafeEqual } from 'crypto';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';

/**
 * PUBLIC controller — không dùng Auth Guard.
 * Facebook gọi trực tiếp vào đây.
 */
@ApiTags('Webhook')
@Controller('webhook/facebook')
export class FacebookWebhookController {
  private readonly logger = new Logger(FacebookWebhookController.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /webhook/facebook — Webhook Verification
   * Facebook gửi GET request khi đăng ký webhook.
   * Verify token match → respond hub.challenge.
   */
  @ApiOperation({ summary: 'Facebook Webhook Verification' })
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.configService.get<string>(
      'facebook.verifyToken',
    );

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('[Verify] Webhook verification successful');
      return res.status(200).send(challenge);
    }

    this.logger.warn(
      `[Verify] Webhook verification failed: mode=${mode}, token mismatch`,
    );
    return res.status(403).send('Verification failed');
  }

  /**
   * POST /webhook/facebook — Receive Messages
   * Facebook gửi POST khi có tin nhắn mới.
   * Phải respond 200 trong 5s → xử lý async.
   */
  @ApiExcludeEndpoint()
  @Post()
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    // Step 1: Verify X-Hub-Signature-256 (HMAC-SHA256)
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!this.verifySignature(req, signature)) {
      this.logger.warn('[Webhook] Invalid signature — rejecting');
      return res.status(403).send('Invalid signature');
    }

    // Step 2: Respond 200 IMMEDIATELY (FB timeout = 5s)
    res.status(200).send('EVENT_RECEIVED');

    // Step 3: Process (fire-and-forget internally)
    this.channelService.processWebhookEvent(body);
  }

  /**
   * Verify Facebook webhook signature using X-Hub-Signature-256 header.
   * HMAC-SHA256(app_secret, raw_body) === signature
   */
  private verifySignature(
    req: RawBodyRequest<Request>,
    signature: string | undefined,
  ): boolean {
    const appSecret = this.configService.get<string>('facebook.appSecret');

    // Dev mode: skip nếu chưa có appSecret
    if (!appSecret) {
      this.logger.warn(
        '[Signature] FB_APP_SECRET not configured, skipping verification',
      );
      return true;
    }

    if (!signature) {
      return false;
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.warn(
        '[Signature] rawBody not available — ensure raw body middleware is enabled',
      );
      return true;
    }

    const expectedSig =
      'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }
}
