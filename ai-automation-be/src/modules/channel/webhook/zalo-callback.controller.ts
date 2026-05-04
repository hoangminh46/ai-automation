import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ChannelService } from '../channel.service.js';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

/**
 * PUBLIC controller — không dùng Auth Guard.
 * Zalo redirect user về đây sau khi authorize.
 * Route: /api/v1/channels/zalo/callback (nằm trong api/v1 prefix, không cần exclude)
 */
@ApiTags('Zalo OAuth')
@Controller('channels/zalo')
export class ZaloCallbackController {
  private readonly logger = new Logger(ZaloCallbackController.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /api/v1/channels/zalo/callback?code=xxx&state=signed_state
   * Zalo redirect user về đây sau khi authorize.
   * Service verify signed state → exchange code → tokens → redirect FE dashboard.
   */
  @ApiExcludeEndpoint()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const feBaseUrl =
      this.configService.get<string>('CORS_ORIGINS')?.split(',')[0] ||
      'http://localhost:3000';

    if (!code || !state) {
      this.logger.warn('[Callback] Missing code or state param');
      return res.redirect(
        `${feBaseUrl}/dashboard/channels?zalo=error&reason=missing_params`,
      );
    }

    try {
      const result = await this.channelService.handleZaloCallback(state, code);

      this.logger.log(
        `[Callback] Zalo OA "${result.oaName}" connected for tenant ${result.tenantId}`,
      );

      return res.redirect(
        `${feBaseUrl}/dashboard/channels?zalo=connected&oa_name=${encodeURIComponent(result.oaName)}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Callback] OAuth failed: ${message}`);

      return res.redirect(
        `${feBaseUrl}/dashboard/channels?zalo=error&reason=${encodeURIComponent(message)}`,
      );
    }
  }
}
