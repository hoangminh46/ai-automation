import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { QuotaService } from './quota.service';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanResponseDto } from './dto/plan-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { UsageResponseDto } from './dto/usage-response.dto';

@ApiTags('Plans & Billing')
@Controller()
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly quotaService: QuotaService,
  ) {}

  @ApiOperation({
    summary: 'Danh sách gói dịch vụ (public, không cần auth)',
  })
  @ApiOkResponse({ type: [PlanResponseDto] })
  @Get('plans')
  async getPlans() {
    return this.planService.findAllActive();
  }

  @ApiOperation({ summary: 'Thông tin subscription của seller hiện tại' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubscriptionResponseDto })
  @UseGuards(SupabaseAuthGuard)
  @Get('sellers/me/subscription')
  async getMySubscription(@CurrentUser() user: { sellerId: string }) {
    const sub = await this.quotaService.getSubscription(user.sellerId);
    return {
      id: sub.id,
      planSlug: sub.plan.slug,
      planName: sub.plan.name,
      status: sub.status,
      billingPeriod: sub.billingPeriod,
      aiResponsesUsed: sub.aiResponsesUsed,
      bonusResponsesRemaining: sub.bonusResponsesRemaining,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  @ApiOperation({
    summary: 'Thống kê usage aggregate của seller (across tenants)',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ type: UsageResponseDto })
  @UseGuards(SupabaseAuthGuard)
  @Get('sellers/me/usage')
  async getMyUsage(@CurrentUser() user: { sellerId: string }) {
    return this.quotaService.getUsageStats(user.sellerId);
  }
}
