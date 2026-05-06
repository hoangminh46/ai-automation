import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PlanService } from './plan.service';

interface DeactivatedResource {
  type: 'bot' | 'team_member';
  id: string;
  name: string;
  tenantId: string;
}

@Injectable()
export class DowngradeService {
  private readonly logger = new Logger(DowngradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
  ) {}

  /**
   * Xử lý khi plan thay đổi (downgrade): deactivate tài nguyên vượt quota.
   *
   * Rules:
   *   - Bots: deactivate LIFO (mới nhất trước) nếu > newPlan.maxBots
   *   - Team: deactivate LIFO (exclude OWNER) nếu > newPlan.maxTeamMembers
   *   - Knowledge: KHÔNG deactivate, chỉ log warning (soft limit)
   *
   * Return danh sách tài nguyên bị deactivate.
   */
  async handlePlanChange(
    sellerId: string,
    newPlanId: string,
  ): Promise<DeactivatedResource[]> {
    const newPlan = await this.prisma.plan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      this.logger.error(
        `[Downgrade] Plan ${newPlanId} not found, skipping downgrade`,
      );
      return [];
    }

    const deactivated: DeactivatedResource[] = [];

    // Step 1: Deactivate excess bots (LIFO — mới nhất bị tắt trước)
    const activeBots = await this.prisma.agent.findMany({
      where: { tenant: { sellerId }, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, tenantId: true },
    });

    if (activeBots.length > newPlan.maxBots) {
      const excessBots = activeBots.slice(newPlan.maxBots);
      const excessBotIds = excessBots.map((b) => b.id);

      await this.prisma.agent.updateMany({
        where: { id: { in: excessBotIds } },
        data: { isActive: false },
      });

      for (const bot of excessBots) {
        deactivated.push({
          type: 'bot',
          id: bot.id,
          name: bot.name,
          tenantId: bot.tenantId,
        });
      }

      this.logger.warn(
        `[Downgrade] seller=${sellerId} deactivated ${excessBots.length} bots ` +
          `(${activeBots.length} → ${newPlan.maxBots})`,
      );
    }

    // Step 2: Deactivate excess team members (LIFO, exclude OWNER)
    if (newPlan.maxTeamMembers !== -1) {
      const activeMembers = await this.prisma.tenantMember.findMany({
        where: {
          tenant: { sellerId },
          isActive: true,
          role: { not: 'OWNER' },
        },
        orderBy: { createdAt: 'desc' },
        include: { seller: { select: { name: true } } },
      });

      if (activeMembers.length > newPlan.maxTeamMembers) {
        const excessMembers = activeMembers.slice(newPlan.maxTeamMembers);
        const excessMemberIds = excessMembers.map((m) => m.id);

        await this.prisma.tenantMember.updateMany({
          where: { id: { in: excessMemberIds } },
          data: { isActive: false },
        });

        for (const member of excessMembers) {
          deactivated.push({
            type: 'team_member',
            id: member.id,
            name: member.seller?.name ?? member.sellerId,
            tenantId: member.tenantId,
          });
        }

        this.logger.warn(
          `[Downgrade] seller=${sellerId} deactivated ${excessMembers.length} members ` +
            `(${activeMembers.length} → ${newPlan.maxTeamMembers})`,
        );
      }
    }

    // Step 3: Knowledge — soft limit, chỉ log warning
    const knowledgeStats = await this.prisma.knowledgeDocument.aggregate({
      where: { tenant: { sellerId } },
      _count: { id: true },
      _sum: { fileSize: true },
    });

    const fileCount = knowledgeStats._count.id;
    const sizeMb = (knowledgeStats._sum.fileSize ?? 0) / (1024 * 1024);

    if (
      fileCount > newPlan.maxKnowledgeFiles ||
      sizeMb > newPlan.maxKnowledgeSizeMb
    ) {
      this.logger.warn(
        `[Downgrade] seller=${sellerId} knowledge exceeds new plan: ` +
          `files=${fileCount}/${newPlan.maxKnowledgeFiles} ` +
          `size=${sizeMb.toFixed(1)}MB/${newPlan.maxKnowledgeSizeMb}MB. ` +
          `Not deactivating (soft limit).`,
      );
    }

    if (deactivated.length > 0) {
      this.logger.log(
        `[Downgrade] seller=${sellerId} total deactivated: ${deactivated.length} resources`,
      );
    }

    return deactivated;
  }
}
