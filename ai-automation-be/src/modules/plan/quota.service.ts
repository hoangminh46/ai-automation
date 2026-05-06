import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PlanService } from './plan.service';

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
  ) {}

  /**
   * Lấy subscription + plan cho seller.
   * Auto-create Free subscription nếu seller chưa có (first-time seller).
   */
  async getSubscription(sellerId: string) {
    const existing = await this.prisma.sellerSubscription.findUnique({
      where: { sellerId },
      include: { plan: true },
    });

    if (existing) return existing;

    // Auto-assign Free plan cho seller mới
    const freePlan = await this.planService.findBySlug('free');

    const created = await this.prisma.sellerSubscription.create({
      data: {
        sellerId,
        planId: freePlan.id,
        billingPeriod: 'MONTHLY',
        status: 'ACTIVE',
        aiResponsesUsed: 0,
        bonusResponsesRemaining: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      },
      include: { plan: true },
    });

    this.logger.log(
      `[AutoAssign] Seller ${sellerId} → Free plan (id=${created.id})`,
    );
    return created;
  }

  /**
   * Resolve sellerId từ tenantId.
   * Dùng cho channel webhook flow (chỉ có tenantId, không có sellerId).
   */
  async getSellerIdFromTenant(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { sellerId: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return tenant.sellerId;
  }

  /**
   * Check AI response quota và deduct 1 nếu còn.
   * Throw 429 nếu hết quota.
   *
   * Logic ưu tiên:
   *   1. Dùng plan quota trước (increment aiResponsesUsed)
   *   2. Hết plan quota → dùng bonus (decrement bonusResponsesRemaining)
   *   3. Hết cả hai → BLOCK
   *
   * Gọi TRƯỚC khi call LLM để đảm bảo atomic (tránh race condition).
   * Trade-off: nếu LLM fail, quota vẫn bị trừ — chấp nhận được vì LLM failure rất hiếm.
   */
  async checkAndDeductAiResponse(sellerId: string): Promise<void> {
    const subscription = await this.getSubscription(sellerId);
    const plan = subscription.plan;

    const planRemaining = plan.maxAiResponses - subscription.aiResponsesUsed;
    const totalAvailable = planRemaining + subscription.bonusResponsesRemaining;

    if (totalAvailable <= 0) {
      this.logger.warn(
        `[QuotaBlock] seller=${sellerId} plan=${plan.slug} ` +
          `used=${subscription.aiResponsesUsed}/${plan.maxAiResponses} ` +
          `bonus=${subscription.bonusResponsesRemaining}`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            `Đã hết quota AI responses ` +
            `(${subscription.aiResponsesUsed}/${plan.maxAiResponses}). ` +
            `Vui lòng mua thêm gói hoặc nâng cấp plan.`,
          code: 'QUOTA_EXHAUSTED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Ưu tiên trừ plan quota trước, nếu hết mới trừ bonus
    if (planRemaining > 0) {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { aiResponsesUsed: { increment: 1 } },
      });
    } else {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { bonusResponsesRemaining: { decrement: 1 } },
      });
    }

    const newUsed = subscription.aiResponsesUsed + (planRemaining > 0 ? 1 : 0);
    const newBonus =
      subscription.bonusResponsesRemaining - (planRemaining > 0 ? 0 : 1);

    this.logger.debug(
      `[QuotaDeduct] seller=${sellerId} plan=${plan.slug} ` +
        `used=${newUsed}/${plan.maxAiResponses} bonus=${newBonus}`,
    );
  }

  /**
   * Check bot limit: COUNT agents (isActive=true) across ALL tenants của seller.
   * Throw 403 nếu đã đạt limit.
   */
  async checkBotLimit(sellerId: string): Promise<void> {
    const subscription = await this.getSubscription(sellerId);
    const plan = subscription.plan;

    const currentBots = await this.prisma.agent.count({
      where: {
        tenant: { sellerId },
        isActive: true,
      },
    });

    if (currentBots >= plan.maxBots) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            `Đã đạt giới hạn ${plan.maxBots} bot cho gói ${plan.name}. ` +
            `Vui lòng nâng cấp plan để tạo thêm.`,
          code: 'BOT_LIMIT_REACHED',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Check team member limit: COUNT members (isActive=true, exclude OWNER) across ALL tenants.
   * Skip nếu maxTeamMembers = -1 (unlimited).
   */
  async checkTeamLimit(sellerId: string): Promise<void> {
    const subscription = await this.getSubscription(sellerId);
    const plan = subscription.plan;

    if (plan.maxTeamMembers === -1) return;

    const currentMembers = await this.prisma.tenantMember.count({
      where: {
        tenant: { sellerId },
        isActive: true,
        role: { not: 'OWNER' },
      },
    });

    if (currentMembers >= plan.maxTeamMembers) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            `Đã đạt giới hạn ${plan.maxTeamMembers} thành viên cho gói ${plan.name}. ` +
            `Vui lòng nâng cấp plan để mời thêm.`,
          code: 'TEAM_LIMIT_REACHED',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Check knowledge limit: COUNT docs + SUM fileSize across ALL tenants của seller.
   * Check cả số lượng file lẫn tổng dung lượng (MB).
   */
  async checkKnowledgeLimit(
    sellerId: string,
    newFileSizeBytes: number,
  ): Promise<void> {
    const subscription = await this.getSubscription(sellerId);
    const plan = subscription.plan;

    const stats = await this.prisma.knowledgeDocument.aggregate({
      where: { tenant: { sellerId } },
      _count: { id: true },
      _sum: { fileSize: true },
    });

    const currentCount = stats._count.id;
    const currentSizeBytes = stats._sum.fileSize ?? 0;
    const newTotalMb = (currentSizeBytes + newFileSizeBytes) / (1024 * 1024);

    if (currentCount >= plan.maxKnowledgeFiles) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            `Đã đạt giới hạn ${plan.maxKnowledgeFiles} tài liệu cho gói ${plan.name}. ` +
            `Vui lòng nâng cấp plan để upload thêm.`,
          code: 'KNOWLEDGE_FILE_LIMIT_REACHED',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (newTotalMb > plan.maxKnowledgeSizeMb) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            `Tổng dung lượng sẽ vượt ${plan.maxKnowledgeSizeMb}MB (hiện ${(currentSizeBytes / (1024 * 1024)).toFixed(1)}MB). ` +
            `Vui lòng nâng cấp plan.`,
          code: 'KNOWLEDGE_SIZE_LIMIT_REACHED',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Inject branding watermark vào AI response cho Free plan.
   * Paid plans → trả nguyên content.
   */
  async injectBranding(sellerId: string, content: string): Promise<string> {
    const subscription = await this.getSubscription(sellerId);

    if (subscription.plan.slug === 'free') {
      return `${content}\n\n🤖 Được hỗ trợ bởi AIChatbot.vn`;
    }

    return content;
  }

  /**
   * Aggregate usage stats across ALL tenants của seller.
   * Dùng cho GET /sellers/me/usage endpoint.
   */
  async getUsageStats(sellerId: string) {
    const subscription = await this.getSubscription(sellerId);
    const plan = subscription.plan;

    const [botsUsed, teamUsed, knowledgeStats] = await Promise.all([
      this.prisma.agent.count({
        where: { tenant: { sellerId }, isActive: true },
      }),
      this.prisma.tenantMember.count({
        where: { tenant: { sellerId }, isActive: true, role: { not: 'OWNER' } },
      }),
      this.prisma.knowledgeDocument.aggregate({
        where: { tenant: { sellerId } },
        _count: { id: true },
        _sum: { fileSize: true },
      }),
    ]);

    const knowledgeFilesUsed = knowledgeStats._count.id;
    const knowledgeSizeUsedMb =
      (knowledgeStats._sum.fileSize ?? 0) / (1024 * 1024);

    let daysRemaining: number | null = null;
    if (subscription.currentPeriodEnd) {
      const msRemaining = subscription.currentPeriodEnd.getTime() - Date.now();
      daysRemaining = Math.max(
        0,
        Math.ceil(msRemaining / (1000 * 60 * 60 * 24)),
      );
    }

    return {
      plan: {
        slug: plan.slug,
        name: plan.name,
      },
      aiResponses: {
        used: subscription.aiResponsesUsed,
        limit: plan.maxAiResponses,
        bonus: subscription.bonusResponsesRemaining,
      },
      bots: {
        used: botsUsed,
        limit: plan.maxBots,
      },
      team: {
        used: teamUsed,
        limit: plan.maxTeamMembers,
      },
      knowledge: {
        filesUsed: knowledgeFilesUsed,
        filesLimit: plan.maxKnowledgeFiles,
        sizeUsedMb: Math.round(knowledgeSizeUsedMb * 10) / 10,
        sizeLimitMb: plan.maxKnowledgeSizeMb,
      },
      billing: {
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining,
      },
    };
  }
}
