import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma.service.js';
import { encryptToken, decryptToken } from '../../../common/crypto.util.js';

const ZALO_TOKEN_ENDPOINT = 'https://oauth.zaloapp.com/v4/oa/access_token';

/** Check mỗi 10 phút, refresh token nào sắp hết hạn trong 10 phút tới */
const REFRESH_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const TOKEN_EXPIRY_BUFFER_MS = 10 * 60 * 1000;
const MAX_RETRY = 3;

interface ZaloTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  error?: number;
  message?: string;
}

@Injectable()
export class ZaloTokenService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZaloTokenService.name);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.refreshInterval = setInterval(() => {
      void this.refreshExpiredTokens();
    }, REFRESH_CHECK_INTERVAL_MS);
    this.logger.log(
      '[Init] Zalo token refresh service started (check every 10 min)',
    );
  }

  onModuleDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Exchange authorization code → access_token + refresh_token.
   * Gọi từ OAuth callback sau khi seller authorize trên Zalo.
   */
  async exchangeCodeForTokens(code: string): Promise<ZaloTokenResponse> {
    const appId = this.configService.get<string>('zalo.appId');
    const appSecret = this.configService.get<string>('zalo.appSecret');

    const response = await fetch(ZALO_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        secret_key: appSecret || '',
      },
      body: new URLSearchParams({
        app_id: appId || '',
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`[ExchangeCode] HTTP ${response.status}: ${errorText}`);
      throw new Error(`Zalo OAuth error: ${response.status}`);
    }

    const data = (await response.json()) as ZaloTokenResponse;

    if (data.error && data.error !== 0) {
      this.logger.error(
        `[ExchangeCode] Zalo error: ${data.error} - ${data.message}`,
      );
      throw new Error(`Zalo OAuth error: ${data.error} - ${data.message}`);
    }

    return data;
  }

  /**
   * Refresh access_token cho 1 connection cụ thể.
   * Trả về access_token mới, đồng thời update DB.
   */
  async refreshTokenForConnection(connectionId: string): Promise<string> {
    const connection = await this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection?.refreshTokenEnc) {
      throw new Error(`No refresh token for connection ${connectionId}`);
    }

    const rawRefreshToken = decryptToken(connection.refreshTokenEnc);
    const newTokens = await this.callRefreshApi(rawRefreshToken);

    await this.prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        accessTokenEnc: encryptToken(newTokens.access_token || ''),
        refreshTokenEnc: encryptToken(newTokens.refresh_token || ''),
        tokenExpiresAt: new Date(
          Date.now() + parseInt(newTokens.expires_in || '3600', 10) * 1000,
        ),
      },
    });

    this.logger.log(`[Refresh] Token refreshed for connection ${connectionId}`);
    return newTokens.access_token || '';
  }

  /**
   * Background job: tìm tất cả Zalo connections sắp hết hạn và refresh.
   */
  async refreshExpiredTokens(): Promise<void> {
    const threshold = new Date(Date.now() + TOKEN_EXPIRY_BUFFER_MS);

    const expiring = await this.prisma.channelConnection.findMany({
      where: {
        channelType: 'ZALO',
        isActive: true,
        tokenExpiresAt: { lt: threshold },
        refreshTokenEnc: { not: null },
      },
    });

    if (expiring.length === 0) return;

    this.logger.log(
      `[RefreshCheck] Found ${expiring.length} Zalo connection(s) to refresh`,
    );

    for (const conn of expiring) {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        try {
          await this.refreshTokenForConnection(conn.id);
          lastError = null;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(
            `[RefreshCheck] Attempt ${attempt}/${MAX_RETRY} failed for ${conn.id}: ${lastError.message}`,
          );
        }
      }

      if (lastError) {
        this.logger.error(
          `[RefreshCheck] All retries failed for ${conn.id}, marking inactive`,
        );
        await this.prisma.channelConnection.update({
          where: { id: conn.id },
          data: { isActive: false },
        });
      }
    }
  }

  /**
   * Gọi Zalo OAuth refresh API.
   * Zalo trả refresh_token MỚI mỗi lần → phải lưu lại.
   */
  private async callRefreshApi(
    refreshToken: string,
  ): Promise<ZaloTokenResponse> {
    const appId = this.configService.get<string>('zalo.appId');
    const appSecret = this.configService.get<string>('zalo.appSecret');

    const response = await fetch(ZALO_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        secret_key: appSecret || '',
      },
      body: new URLSearchParams({
        app_id: appId || '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zalo refresh HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ZaloTokenResponse;

    if (data.error && data.error !== 0) {
      throw new Error(`Zalo refresh error: ${data.error} - ${data.message}`);
    }

    if (!data.access_token) {
      throw new Error('Zalo refresh: no access_token in response');
    }

    return data;
  }
}
