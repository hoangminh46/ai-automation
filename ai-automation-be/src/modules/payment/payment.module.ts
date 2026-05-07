import { Module } from '@nestjs/common';
import { PlanModule } from '../plan/plan.module.js';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { SepayWebhookController } from './webhook/sepay-webhook.controller.js';

@Module({
  imports: [PlanModule],
  controllers: [PaymentController, SepayWebhookController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
