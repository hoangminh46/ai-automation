import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { PlanService } from '../plan/plan.service';
import { QuotaService } from '../plan/quota.service';
import { DowngradeService } from '../plan/downgrade.service';
import type { PaymentOrder, BillingPeriod, PrismaClient } from '@prisma/client';

// Response pack pricing — cần chuyển sang DB/config khi đi production
// Hiện tại: 10 VND/response (VD: 500 responses = 5,000 VND)
const RESPONSE_PACK_PRICE_PER_UNIT = 10;

// Order hết hạn sau 30 phút
const ORDER_EXPIRY_MINUTES = 30;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paymentCodePrefix: string;
  private readonly accountNo: string;
  private readonly bankName: string;
  private readonly accountName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
    private readonly quotaService: QuotaService,
    private readonly downgradeService: DowngradeService,
    private readonly configService: ConfigService,
  ) {
    this.paymentCodePrefix =
      this.configService.get<string>('sepay.paymentCodePrefix') || 'AICHAT';
    this.accountNo = this.configService.get<string>('sepay.accountNo') || '';
    this.bankName =
      this.configService.get<string>('sepay.bankName') || 'MBBank';
    this.accountName =
      this.configService.get<string>('sepay.accountName') || '';
  }

  /**
   * Sinh orderCode unique 6 chữ số.
   * Loop tối đa 10 lần để tránh collision (xác suất thấp nhưng cần đảm bảo).
   */
  private async generateOrderCode(): Promise<string> {
    const MAX_ATTEMPTS = 10;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const code = String(Math.floor(100000 + Math.random() * 900000));

      const existing = await this.prisma.paymentOrder.findUnique({
        where: { orderCode: code },
      });

      if (!existing) return code;

      this.logger.debug(
        `[OrderCode] Collision on "${code}", retry ${attempt}/${MAX_ATTEMPTS}`,
      );
    }

    throw new ConflictException(
      `Không thể sinh mã thanh toán sau ${MAX_ATTEMPTS} lần thử. Vui lòng thử lại.`,
    );
  }

  /**
   * Tính expiresAt cho order (30 phút từ lúc tạo).
   */
  private calculateExpiresAt(): Date {
    return new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);
  }

  /**
   * Build transferContent theo format: "{PREFIX} {orderCode}"
   * SePay sẽ extract orderCode từ nội dung CK khi nhận webhook.
   */
  private buildTransferContent(orderCode: string): string {
    return `${this.paymentCodePrefix} ${orderCode}`;
  }

  /**
   * Kiểm tra seller đã có PENDING order chưa.
   * Business rule: chỉ cho phép 1 PENDING order/seller tại 1 thời điểm.
   * Nếu order cũ đã hết hạn (expiresAt < now) thì tự expire trước khi check.
   *
   * Race condition mitigation: method này được gọi bên trong $transaction
   * của createSubscriptionOrder/createResponsePackOrder để đảm bảo
   * check-then-create là atomic.
   */
  private async ensureNoPendingOrder(
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$use' | '$extends' | '$transaction'
    >,
    sellerId: string,
  ): Promise<void> {
    // Step 1: Tự expire order hết hạn nếu có (tránh block vĩnh viễn)
    await tx.paymentOrder.updateMany({
      where: {
        sellerId,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    // Step 2: Check nếu vẫn còn PENDING order hợp lệ
    const pending = await tx.paymentOrder.findFirst({
      where: { sellerId, status: 'PENDING' },
      select: { orderCode: true, expiresAt: true },
    });

    if (pending) {
      throw new ConflictException(
        `Bạn đang có đơn thanh toán chưa hoàn tất (mã: ${pending.orderCode}). ` +
          `Vui lòng hoàn tất hoặc đợi đơn hết hạn trước khi tạo đơn mới.`,
      );
    }
  }

  /**
   * Tạo đơn thanh toán Subscription.
   *
   * Validations:
   *   - Plan phải tồn tại và active
   *   - Không cho downgrade qua payment (dùng admin)
   *   - Không cho phép 2 PENDING orders cùng lúc
   *
   * Race condition safety: check pending + create order
   * nằm trong cùng 1 transaction.
   */
  async createSubscriptionOrder(
    sellerId: string,
    planSlug: string,
    billingPeriod: BillingPeriod = 'MONTHLY',
  ): Promise<PaymentOrder> {
    // Step 1: Validate plan (ngoài transaction vì read-only, idempotent)
    const plan = await this.planService.findBySlug(planSlug);

    if (!plan.isActive) {
      throw new BadRequestException(`Gói "${plan.name}" hiện không khả dụng.`);
    }

    if (plan.slug === 'free') {
      throw new BadRequestException(
        'Không thể mua gói Free. Gói Free được cấp tự động.',
      );
    }

    // Step 2: Validate không phải downgrade (so sánh giá)
    const currentSub = await this.quotaService.getSubscription(sellerId);
    if (currentSub.plan.price > 0 && plan.price < currentSub.plan.price) {
      throw new BadRequestException(
        `Không hỗ trợ downgrade qua thanh toán. ` +
          `Hiện tại: ${currentSub.plan.name} (${currentSub.plan.price.toLocaleString()}đ) → ` +
          `Yêu cầu: ${plan.name} (${plan.price.toLocaleString()}đ). ` +
          `Vui lòng liên hệ admin.`,
      );
    }

    // Step 3: Không cho tạo order nếu đang cùng plan + ACTIVE
    if (
      currentSub.planId === plan.id &&
      currentSub.status === 'ACTIVE' &&
      currentSub.currentPeriodEnd &&
      currentSub.currentPeriodEnd.getTime() > Date.now()
    ) {
      throw new BadRequestException(
        `Bạn đang sử dụng gói ${plan.name} và chưa hết hạn. ` +
          `Gia hạn sẽ khả dụng khi gói gần hết hạn.`,
      );
    }

    // Step 4 + 5: Check pending + tạo order trong cùng transaction
    const orderCode = await this.generateOrderCode();
    const transferContent = this.buildTransferContent(orderCode);

    const order = await this.prisma.$transaction(async (tx) => {
      await this.ensureNoPendingOrder(tx, sellerId);

      return tx.paymentOrder.create({
        data: {
          sellerId,
          orderCode,
          type: 'SUBSCRIPTION',
          planId: plan.id,
          billingPeriod,
          amount: plan.price,
          transferContent,
          status: 'PENDING',
          expiresAt: this.calculateExpiresAt(),
        },
      });
    });

    this.logger.log(
      `[CreateOrder] seller=${sellerId} type=SUBSCRIPTION ` +
        `plan=${plan.slug} amount=${plan.price} code=${orderCode}`,
    );

    return order;
  }

  /**
   * Tạo đơn thanh toán Response Pack.
   * Race condition safety: check pending + create trong cùng 1 transaction.
   */
  async createResponsePackOrder(
    sellerId: string,
    packSize: number,
  ): Promise<PaymentOrder> {
    const amount = packSize * RESPONSE_PACK_PRICE_PER_UNIT;
    const orderCode = await this.generateOrderCode();
    const transferContent = this.buildTransferContent(orderCode);

    const order = await this.prisma.$transaction(async (tx) => {
      await this.ensureNoPendingOrder(tx, sellerId);

      return tx.paymentOrder.create({
        data: {
          sellerId,
          orderCode,
          type: 'RESPONSE_PACK',
          responsePackSize: packSize,
          amount,
          transferContent,
          status: 'PENDING',
          expiresAt: this.calculateExpiresAt(),
        },
      });
    });

    this.logger.log(
      `[CreateOrder] seller=${sellerId} type=RESPONSE_PACK ` +
        `packSize=${packSize} amount=${amount} code=${orderCode}`,
    );

    return order;
  }

  /**
   * Tìm PENDING order theo orderCode.
   * Dùng bởi webhook handler khi match giao dịch.
   */
  async findPendingByOrderCode(
    orderCode: string,
  ): Promise<PaymentOrder | null> {
    return this.prisma.paymentOrder.findFirst({
      where: {
        orderCode,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Hoàn tất order: PENDING → COMPLETED.
   *
   * Dùng Prisma transaction để đảm bảo atomicity:
   *   1. Update PaymentOrder → COMPLETED
   *   2. Update/create SellerSubscription (type=SUBSCRIPTION)
   *      HOẶC cộng bonus responses (type=RESPONSE_PACK)
   *   3. Resync quota nếu cần (downgrade handling khi upgrade)
   */
  async completeOrder(
    orderId: string,
    sepayTransId: number,
  ): Promise<PaymentOrder> {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`PaymentOrder ${orderId} không tồn tại.`);
    }

    if (order.status !== 'PENDING') {
      this.logger.warn(
        `[CompleteOrder] order=${orderId} already ${order.status}, skipping`,
      );
      return order;
    }

    // Dedup: nếu sepayTransId đã được dùng thì skip
    if (sepayTransId) {
      const existingByTrans = await this.prisma.paymentOrder.findUnique({
        where: { sepayTransId },
      });
      if (existingByTrans) {
        this.logger.warn(
          `[CompleteOrder] sepayTransId=${sepayTransId} already used by order=${existingByTrans.id}, ` +
            `skipping duplicate for order=${orderId}`,
        );
        return existingByTrans;
      }
    }

    const completedOrder = await this.prisma.$transaction(async (tx) => {
      // Step 1: Mark order COMPLETED
      const updated = await tx.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          sepayTransId,
          completedAt: new Date(),
        },
      });

      // Step 2: Activate based on type
      if (order.type === 'SUBSCRIPTION' && order.planId) {
        await this.activateSubscription(
          tx,
          order.sellerId,
          order.planId,
          order.billingPeriod || 'MONTHLY',
        );
      } else if (order.type === 'RESPONSE_PACK' && order.responsePackSize) {
        // Đảm bảo subscription tồn tại trước khi cộng bonus (auto-create Free nếu chưa có)
        // Gọi ngoài tx vì quotaService.getSubscription dùng this.prisma riêng
        // → Acceptable: subscription Free tạo ra sẽ không cần rollback
        await this.quotaService.getSubscription(order.sellerId);

        await this.addBonusResponses(
          tx,
          order.sellerId,
          order.responsePackSize,
        );
      }

      return updated;
    });

    this.logger.log(
      `[CompleteOrder] order=${orderId} type=${order.type} ` +
        `seller=${order.sellerId} sepayTransId=${sepayTransId} → COMPLETED`,
    );

    return completedOrder;
  }

  /**
   * Kích hoạt subscription cho seller.
   * Update SellerSubscription (1:1) với plan mới + period mới.
   */
  private async activateSubscription(
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$use' | '$extends' | '$transaction'
    >,
    sellerId: string,
    planId: string,
    billingPeriod: BillingPeriod,
  ): Promise<void> {
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, billingPeriod);

    const existingSub = await tx.sellerSubscription.findUnique({
      where: { sellerId },
    });

    if (existingSub) {
      await tx.sellerSubscription.update({
        where: { sellerId },
        data: {
          planId,
          billingPeriod,
          status: 'ACTIVE',
          aiResponsesUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          reminderSentAt: null, // Reset reminder cho period mới
        },
      });
    } else {
      await tx.sellerSubscription.create({
        data: {
          sellerId,
          planId,
          billingPeriod,
          status: 'ACTIVE',
          aiResponsesUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    this.logger.log(
      `[ActivateSubscription] seller=${sellerId} plan=${planId} ` +
        `period=${billingPeriod} end=${periodEnd.toISOString()}`,
    );

    // Downgrade handling: nếu plan mới có limit thấp hơn tài nguyên hiện tại
    // thì deactivate excess resources (chạy ngoài transaction vì không critical)
    setImmediate(() => {
      this.downgradeService
        .handlePlanChange(sellerId, planId)
        .catch((error) => {
          this.logger.error(
            `[ActivateSubscription] Downgrade check failed for seller=${sellerId}: ${error}`,
          );
        });
    });
  }

  /**
   * Cộng bonus responses khi mua Response Pack.
   */
  private async addBonusResponses(
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$use' | '$extends' | '$transaction'
    >,
    sellerId: string,
    packSize: number,
  ): Promise<void> {
    await tx.sellerSubscription.update({
      where: { sellerId },
      data: { bonusResponsesRemaining: { increment: packSize } },
    });

    // Ghi lịch sử vào response_pack_purchases
    await tx.responsePackPurchase.create({
      data: {
        sellerId,
        amount: packSize,
        price: packSize * RESPONSE_PACK_PRICE_PER_UNIT,
      },
    });

    this.logger.log(`[AddBonus] seller=${sellerId} +${packSize} responses`);
  }

  /**
   * Tính ngày kết thúc period dựa trên billing period.
   */
  private calculatePeriodEnd(start: Date, period: BillingPeriod): Date {
    const end = new Date(start);
    switch (period) {
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'QUARTERLY':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'SEMI_ANNUAL':
        end.setMonth(end.getMonth() + 6);
        break;
      case 'ANNUAL':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    return end;
  }

  /**
   * Cancel order (PENDING → CANCELLED).
   * User tự cancel hoặc admin cancel.
   */
  async cancelOrder(orderId: string, sellerId: string): Promise<PaymentOrder> {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`PaymentOrder ${orderId} không tồn tại.`);
    }

    if (order.sellerId !== sellerId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn này.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Chỉ có thể hủy đơn đang PENDING. Trạng thái hiện tại: ${order.status}.`,
      );
    }

    const cancelled = await this.prisma.paymentOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    this.logger.log(
      `[CancelOrder] order=${orderId} seller=${sellerId} → CANCELLED`,
    );

    return cancelled;
  }

  /**
   * Lấy order theo ID (cho polling status từ FE).
   */
  async getOrderById(orderId: string, sellerId: string): Promise<PaymentOrder> {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.sellerId !== sellerId) {
      throw new NotFoundException(`PaymentOrder không tồn tại.`);
    }

    return order;
  }

  /**
   * Lấy danh sách orders của seller (history).
   */
  async getOrdersBySeller(
    sellerId: string,
    options?: { status?: string; limit?: number },
  ): Promise<PaymentOrder[]> {
    return this.prisma.paymentOrder.findMany({
      where: {
        sellerId,
        ...(options?.status
          ? { status: options.status as PaymentOrder['status'] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    });
  }

  /**
   * Cron: Expire stale orders (PENDING > 30 phút).
   * Chạy mỗi 5 phút để cleanup kịp thời.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleOrders(): Promise<void> {
    const result = await this.prisma.paymentOrder.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(
        `[ExpireStaleOrders] Expired ${result.count} stale orders`,
      );
    }
  }

  /**
   * Build SePay QR URL cho VietQR.
   * Format: https://qr.sepay.vn/img?acc={STK}&bank={BANK}&amount={AMOUNT}&des={CONTENT}
   */
  buildQrUrl(order: { amount: number; transferContent: string }): string {
    const params = new URLSearchParams({
      acc: this.accountNo,
      bank: this.bankName,
      amount: String(order.amount),
      des: order.transferContent,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Trả thông tin ngân hàng nhận tiền cho FE hiển thị.
   */
  getBankInfo(): {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } {
    return {
      bankName: this.bankName,
      accountNumber: this.accountNo,
      accountName: this.accountName,
    };
  }
}
