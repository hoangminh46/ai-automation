import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'uuid-subscription-id' })
  id: string;

  @ApiProperty({ example: 'free' })
  planSlug: string;

  @ApiProperty({ example: 'Free' })
  planName: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 'MONTHLY' })
  billingPeriod: string;

  @ApiProperty({ example: 10 })
  aiResponsesUsed: number;

  @ApiProperty({ example: 0 })
  bonusResponsesRemaining: number;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  currentPeriodStart: Date;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  currentPeriodEnd: Date | null;
}
