import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ChannelService } from '../channel.service.js';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

/**
 * PUBLIC controller — không dùng Auth Guard.
 * Facebook redirect user về đây sau khi authorize.
 * Route: /api/v1/channels/facebook/callback (nằm trong api/v1 prefix)
 */
@ApiTags('Facebook OAuth')
@Controller('channels/facebook')
export class FacebookCallbackController {
  private readonly logger = new Logger(FacebookCallbackController.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /api/v1/channels/facebook/callback?code=xxx&state=signed_state
   * Facebook redirect user về đây sau khi authorize.
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
        `${feBaseUrl}/dashboard/channels?facebook=error&reason=missing_params`,
      );
    }

    try {
      const result = await this.channelService.handleFacebookCallback(
        state,
        code,
      );

      // Multi-page: redirect to FE page selection
      if (result.sessionId) {
        this.logger.log(
          `[Callback] Multiple pages found for tenant ${result.tenantId}, redirecting to selection`,
        );
        return res.redirect(
          `${feBaseUrl}/dashboard/channels?facebook=select_page&session_id=${result.sessionId}`,
        );
      }

      this.logger.log(
        `[Callback] Facebook Page "${result.pageName}" connected for tenant ${result.tenantId}`,
      );

      return res.redirect(
        `${feBaseUrl}/dashboard/channels?facebook=connected&page_name=${encodeURIComponent(result.pageName || '')}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Callback] OAuth failed: ${message}`);

      return res.redirect(
        `${feBaseUrl}/dashboard/channels?facebook=error&reason=${encodeURIComponent(message)}`,
      );
    }
  }
}
