import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import {
  CreateSubscriptionOrderDto,
  CreateResponsePackOrderDto,
} from './dto/create-order.dto';

@ApiTags('Payment')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /sellers/me/payment-orders/subscription
   * Tạo đơn thanh toán subscription (nâng cấp gói).
   */
  @Post('sellers/me/payment-orders/subscription')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Tạo đơn thanh toán subscription' })
  async createSubscriptionOrder(
    @CurrentUser() user: { sellerId: string },
    @Body() dto: CreateSubscriptionOrderDto,
  ) {
    const order = await this.paymentService.createSubscriptionOrder(
      user.sellerId,
      dto.planSlug,
      dto.billingPeriod,
    );

    return {
      order: this.formatOrder(order),
      qrUrl: this.paymentService.buildQrUrl(order),
      bankInfo: this.paymentService.getBankInfo(),
    };
  }

  /**
   * POST /sellers/me/payment-orders/response-pack
   * Tạo đơn mua thêm AI responses.
   */
  @Post('sellers/me/payment-orders/response-pack')
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Tạo đơn mua thêm AI responses' })
  async createResponsePackOrder(
    @CurrentUser() user: { sellerId: string },
    @Body() dto: CreateResponsePackOrderDto,
  ) {
    const order = await this.paymentService.createResponsePackOrder(
      user.sellerId,
      dto.packSize,
    );

    return {
      order: this.formatOrder(order),
      qrUrl: this.paymentService.buildQrUrl(order),
      bankInfo: this.paymentService.getBankInfo(),
    };
  }

  /**
   * GET /sellers/me/payment-orders/:id/status
   * Lightweight status polling (FE gọi mỗi 3s).
   */
  @Get('sellers/me/payment-orders/:id/status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái đơn thanh toán (polling)' })
  async checkOrderStatus(
    @CurrentUser() user: { sellerId: string },
    @Param('id') orderId: string,
  ) {
    const order = await this.paymentService.getOrderById(
      orderId,
      user.sellerId,
    );
    return {
      status: order.status,
      completedAt: order.completedAt,
    };
  }

  /**
   * DELETE /sellers/me/payment-orders/:id
   * Hủy đơn đang PENDING.
   */
  @Delete('sellers/me/payment-orders/:id')
  @ApiOperation({ summary: 'Hủy đơn thanh toán đang PENDING' })
  async cancelOrder(
    @CurrentUser() user: { sellerId: string },
    @Param('id') orderId: string,
  ) {
    const order = await this.paymentService.cancelOrder(orderId, user.sellerId);
    return this.formatOrder(order);
  }

  /**
   * GET /sellers/me/payment-orders
   * Lịch sử thanh toán (newest first, paginated).
   */
  @Get('sellers/me/payment-orders')
  @ApiOperation({ summary: 'Lịch sử thanh toán' })
  async getOrderHistory(
    @CurrentUser() user: { sellerId: string },
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    const orders = await this.paymentService.getOrdersBySeller(user.sellerId, {
      status,
      limit: limit ?? 50,
    });
    return orders.map((o) => this.formatOrder(o));
  }

  /**
   * Format order cho response — chỉ trả fields cần thiết cho FE.
   */
  private formatOrder(order: {
    id: string;
    orderCode: string;
    type: string;
    amount: number;
    transferContent: string;
    status: string;
    expiresAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    responsePackSize?: number | null;
    planId?: string | null;
  }) {
    return {
      id: order.id,
      orderCode: order.orderCode,
      type: order.type,
      amount: order.amount,
      transferContent: order.transferContent,
      status: order.status,
      expiresAt: order.expiresAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
      ...(order.responsePackSize
        ? { responsePackSize: order.responsePackSize }
        : {}),
    };
  }
}
