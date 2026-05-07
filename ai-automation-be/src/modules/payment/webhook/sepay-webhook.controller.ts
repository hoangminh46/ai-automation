import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  Logger,
  UnauthorizedException,
  Ip,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { PaymentService } from '../payment.service';
import { SepayWebhookPayload } from '../dto/sepay-webhook.dto';

// SePay server IPs — optional whitelist cho thêm lớp bảo mật
const SEPAY_ALLOWED_IPS = [
  '172.236.138.20',
  '172.233.83.68',
  '171.244.35.2',
  '151.158.108.68',
  '151.158.109.79',
  '103.255.238.139',
];

@ApiTags('Webhook')
@Controller('webhook')
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);
  private readonly sepayApiKey: string;
  private readonly paymentCodePrefix: string;
  private readonly ipWhitelistEnabled: boolean;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {
    this.sepayApiKey = this.configService.get<string>('sepay.apiKey') || '';
    this.paymentCodePrefix =
      this.configService.get<string>('sepay.paymentCodePrefix') || 'AICHAT';
    // Chỉ bật IP whitelist khi có config rõ ràng (production)
    this.ipWhitelistEnabled =
      this.configService.get<string>('SEPAY_IP_WHITELIST') === 'true';
  }

  /**
   * POST /webhook/sepay
   *
   * SePay gọi endpoint này khi có giao dịch mới vào tài khoản.
   * Flow: Verify auth → Filter transfer type → Extract orderCode → Match → Complete
   *
   * Luôn trả 200 + { success: true } để SePay không retry vô hạn,
   * kể cả khi order không match (log warning thay vì throw).
   */
  @Post('sepay')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  @UsePipes() // Bypass global ValidationPipe — webhook payload không có class-validator decorators
  async handleSepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookPayload,
    @Ip() clientIp: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `[Webhook] Received: id=${payload.id} type=${payload.transferType} ` +
        `amount=${payload.transferAmount} content="${payload.content}" ip=${clientIp}`,
    );

    // Step 1: Verify API Key (timing-safe comparison)
    if (!this.verifySepayAuth(authHeader)) {
      this.logger.warn(`[Webhook] Invalid API Key from ip=${clientIp}`);
      throw new UnauthorizedException('Invalid API Key');
    }

    // Step 2: IP whitelist (optional, chỉ khi bật)
    if (this.ipWhitelistEnabled && !SEPAY_ALLOWED_IPS.includes(clientIp)) {
      this.logger.warn(`[Webhook] IP not whitelisted: ${clientIp}`);
      throw new UnauthorizedException('IP not allowed');
    }

    // Step 3: Chỉ xử lý giao dịch "nhận tiền" (transferType = "in")
    if (payload.transferType !== 'in') {
      this.logger.debug(
        `[Webhook] Skipping non-incoming transfer: type=${payload.transferType}`,
      );
      return { success: true };
    }

    // Step 4: Extract orderCode từ nội dung chuyển khoản
    const orderCode = this.extractOrderCode(payload.content);
    if (!orderCode) {
      this.logger.debug(
        `[Webhook] No orderCode found in content: "${payload.content}"`,
      );
      return { success: true };
    }

    // Step 5: Tìm PENDING order
    const order = await this.paymentService.findPendingByOrderCode(orderCode);
    if (!order) {
      this.logger.warn(
        `[Webhook] No PENDING order for code=${orderCode} (may be expired or already completed)`,
      );
      return { success: true };
    }

    // Step 6: Verify số tiền >= order amount
    if (payload.transferAmount < order.amount) {
      this.logger.warn(
        `[Webhook] Amount mismatch: received=${payload.transferAmount} expected=${order.amount} ` +
          `order=${order.id} code=${orderCode}`,
      );
      return { success: true };
    }

    // Step 7: Complete order (dedup bằng sepayTransId bên trong)
    try {
      await this.paymentService.completeOrder(order.id, payload.id);
      this.logger.log(
        `[Webhook] Order completed: order=${order.id} code=${orderCode} ` +
          `sepayTransId=${payload.id} amount=${payload.transferAmount}`,
      );
    } catch (error) {
      // Log nhưng vẫn trả 200 để SePay không retry
      this.logger.error(
        `[Webhook] Failed to complete order=${order.id}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return { success: true };
  }

  /**
   * Verify SePay API Key bằng timing-safe comparison.
   * Header format: "Apikey {key}"
   */
  private verifySepayAuth(authHeader: string | undefined): boolean {
    if (!authHeader || !this.sepayApiKey) return false;

    const expected = `Apikey ${this.sepayApiKey}`;

    // Timing-safe compare để tránh timing attack
    if (authHeader.length !== expected.length) return false;

    try {
      return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Extract orderCode 6 chữ số từ nội dung chuyển khoản.
   *
   * Content examples:
   *   "AICHAT 761197 chuyen tien" → "761197"
   *   "aichat761197"              → "761197"
   *   "Thanh toan AICHAT 123456"  → "123456"
   *   "Random content no code"    → null
   */
  private extractOrderCode(content: string): string | null {
    // Pattern: PREFIX + optional space + 6 digits
    const regex = new RegExp(`${this.paymentCodePrefix}\\s*(\\d{6})`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
  }
}
