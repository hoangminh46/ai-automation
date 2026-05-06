import { ApiProperty } from '@nestjs/swagger';

class UsagePlanDto {
  @ApiProperty({ example: 'free' })
  slug: string;

  @ApiProperty({ example: 'Free' })
  name: string;
}

class AiResponsesUsageDto {
  @ApiProperty({ example: 10 })
  used: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 0 })
  bonus: number;
}

class ResourceUsageDto {
  @ApiProperty({ example: 1 })
  used: number;

  @ApiProperty({ example: 1 })
  limit: number;
}

class KnowledgeUsageDto {
  @ApiProperty({ example: 2 })
  filesUsed: number;

  @ApiProperty({ example: 3 })
  filesLimit: number;

  @ApiProperty({ example: 1.5 })
  sizeUsedMb: number;

  @ApiProperty({ example: 5 })
  sizeLimitMb: number;
}

class BillingInfoDto {
  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  currentPeriodStart: Date;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  currentPeriodEnd: Date | null;

  @ApiProperty({ example: 25, nullable: true })
  daysRemaining: number | null;
}

export class UsageResponseDto {
  @ApiProperty({ type: UsagePlanDto })
  plan: UsagePlanDto;

  @ApiProperty({ type: AiResponsesUsageDto })
  aiResponses: AiResponsesUsageDto;

  @ApiProperty({ type: ResourceUsageDto })
  bots: ResourceUsageDto;

  @ApiProperty({ type: ResourceUsageDto })
  team: ResourceUsageDto;

  @ApiProperty({ type: KnowledgeUsageDto })
  knowledge: KnowledgeUsageDto;

  @ApiProperty({ type: BillingInfoDto })
  billing: BillingInfoDto;
}
