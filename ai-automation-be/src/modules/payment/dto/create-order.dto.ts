import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingPeriod } from '@prisma/client';

export class CreateSubscriptionOrderDto {
  @ApiProperty({ example: 'basic', description: 'Slug của plan muốn mua' })
  @IsString()
  planSlug: string;

  @ApiPropertyOptional({
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
    description: 'Chu kỳ thanh toán',
  })
  @IsEnum(BillingPeriod)
  @IsOptional()
  billingPeriod?: BillingPeriod = BillingPeriod.MONTHLY;
}

export class CreateResponsePackOrderDto {
  @ApiProperty({
    example: 500,
    minimum: 100,
    description: 'Số AI responses muốn mua thêm',
  })
  @IsInt()
  @Min(100)
  packSize: number;
}
