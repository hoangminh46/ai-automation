import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { QuotaService } from './quota.service';
import { MonthlyResetService } from './monthly-reset.service';
import { DowngradeService } from './downgrade.service';
import { ExpiryCheckService } from './expiry-check.service';
import { ExpiryReminderService } from './expiry-reminder.service';
import { PlanController } from './plan.controller';

@Module({
  controllers: [PlanController],
  providers: [
    PlanService,
    QuotaService,
    MonthlyResetService,
    DowngradeService,
    ExpiryCheckService,
    ExpiryReminderService,
  ],
  exports: [PlanService, QuotaService, DowngradeService],
})
export class PlanModule {}
