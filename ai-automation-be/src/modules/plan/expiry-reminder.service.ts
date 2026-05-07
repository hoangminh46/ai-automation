import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';

/**
 * Cron job mỗi 6 giờ: tìm subscriptions sắp hết hạn (≤ 3 ngày)
 * → emit WebSocket event `subscription_expiring_soon` tới seller.
 *
 * Flag `reminderSentAt` ngăn gửi lặp trong cùng billing period.
 * Reset khi subscription được gia hạn (PaymentService sẽ set null).
 */
@Injectable()
export class ExpiryReminderService {
  private readonly logger = new Logger(ExpiryReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Cron('0 */6 * * *')
  async handleExpiryReminder(): Promise<void> {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    this.logger.log(
      '[ExpiryReminder] Scanning for subscriptions expiring within 3 days...',
    );

    const expiringSubs: Array<{
      id: string;
      sellerId: string;
      currentPeriodEnd: Date | null;
      plan: { name: string };
      seller: { authId: string };
    }> = await this.prisma.sellerSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          not: null,
          lte: threeDaysLater,
          gt: now, // Chưa hết hạn (vẫn active)
        },
        reminderSentAt: null, // Chưa gửi reminder trong period này
      },
      select: {
        id: true,
        sellerId: true,
        currentPeriodEnd: true,
        plan: { select: { name: true } },
        seller: { select: { authId: true } },
      },
    });

    if (expiringSubs.length === 0) {
      this.logger.log('[ExpiryReminder] No expiring subscriptions found.');
      return;
    }

    this.logger.warn(
      `[ExpiryReminder] Found ${expiringSubs.length} subscriptions expiring soon`,
    );

    for (const sub of expiringSubs) {
      try {
        const daysLeft = Math.ceil(
          (sub.currentPeriodEnd!.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        );

        // Gửi WS notification
        this.notificationGateway.emitToSeller(
          sub.seller.authId,
          'subscription_expiring_soon',
          {
            sellerId: sub.sellerId,
            daysLeft,
            planName: sub.plan.name,
            expiresAt: sub.currentPeriodEnd!.toISOString(),
          },
        );

        // Đánh dấu đã gửi reminder
        await this.prisma.sellerSubscription.update({
          where: { id: sub.id },
          data: { reminderSentAt: now },
        });

        this.logger.log(
          `[ExpiryReminder] Sent to seller=${sub.sellerId}, daysLeft=${daysLeft}, plan=${sub.plan.name}`,
        );
      } catch (error) {
        this.logger.error(
          `[ExpiryReminder] Failed for seller=${sub.sellerId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }
}
