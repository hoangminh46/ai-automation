import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MonthlyResetService {
  private readonly logger = new Logger(MonthlyResetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Monthly reset: ngày 1 mỗi tháng lúc 00:00 UTC.
   * - Reset aiResponsesUsed = 0
   * - Update currentPeriodStart/End cho chu kỳ mới
   * - KHÔNG reset bonusResponsesRemaining (bonus mua thêm giữ nguyên)
   * - Chỉ reset subscriptions ACTIVE (EXPIRED/CANCELLED không cần reset)
   * - Idempotent: check currentPeriodStart để tránh reset trùng tháng
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyReset(): Promise<void> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    this.logger.log(
      `[MonthlyReset] Starting for period ${currentMonthStart.toISOString()}`,
    );

    // Idempotent: chỉ reset những subscription có currentPeriodStart TRƯỚC tháng hiện tại
    const result = await this.prisma.sellerSubscription.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodStart: { lt: currentMonthStart },
      },
      data: {
        aiResponsesUsed: 0,
        currentPeriodStart: currentMonthStart,
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });

    this.logger.log(
      `[MonthlyReset] Done. ${result.count} subscriptions reset.`,
    );
  }
}
