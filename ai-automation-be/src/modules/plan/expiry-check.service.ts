import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { PlanService } from './plan.service';
import { DowngradeService } from './downgrade.service';

@Injectable()
export class ExpiryCheckService {
  private readonly logger = new Logger(ExpiryCheckService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
    private readonly downgradeService: DowngradeService,
  ) {}

  /**
   * Mỗi 6 giờ: tìm subscriptions đã hết hạn → auto-downgrade về Free.
   *
   * Idempotent: chỉ xử lý status = ACTIVE AND currentPeriodEnd < now().
   * Free plan (currentPeriodEnd = null) sẽ KHÔNG bị bắt vì null < now() = false trong Prisma.
   *
   * Do SellerSubscription có sellerId @unique (1:1), KHÔNG thể create
   * subscription mới — phải UPDATE record hiện tại sang Free plan.
   */
  @Cron('0 */6 * * *')
  async handleExpiryCheck(): Promise<void> {
    const now = new Date();

    this.logger.log('[ExpiryCheck] Starting subscription expiry scan...');

    const expiredSubscriptions = await this.prisma.sellerSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      select: { id: true, sellerId: true },
    });

    if (expiredSubscriptions.length === 0) {
      this.logger.log('[ExpiryCheck] No expired subscriptions found.');
      return;
    }

    this.logger.warn(
      `[ExpiryCheck] Found ${expiredSubscriptions.length} expired subscriptions`,
    );

    const freePlan = await this.planService.findBySlug('free');

    for (const sub of expiredSubscriptions) {
      try {
        // Update subscription: downgrade to Free plan (1:1 relation, cannot create new)
        await this.prisma.sellerSubscription.update({
          where: { id: sub.id },
          data: {
            planId: freePlan.id,
            status: 'ACTIVE',
            billingPeriod: 'MONTHLY',
            aiResponsesUsed: 0,
            bonusResponsesRemaining: 0,
            currentPeriodStart: now,
            currentPeriodEnd: null,
          },
        });

        // Downgrade resources to match Free plan limits
        const deactivated = await this.downgradeService.handlePlanChange(
          sub.sellerId,
          freePlan.id,
        );

        this.logger.log(
          `[ExpiryCheck] seller=${sub.sellerId} → expired → downgraded to Free. ` +
            `Deactivated: ${deactivated.length} resources.`,
        );
      } catch (error) {
        this.logger.error(
          `[ExpiryCheck] Failed for seller=${sub.sellerId}: ` +
            `${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `[ExpiryCheck] Done. Processed ${expiredSubscriptions.length} subscriptions.`,
    );
  }
}
