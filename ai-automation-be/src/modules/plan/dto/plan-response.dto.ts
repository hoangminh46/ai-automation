import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ example: 'free' })
  slug: string;

  @ApiProperty({ example: 'Free' })
  name: string;

  @ApiProperty({ example: 0 })
  price: number;

  @ApiProperty({ example: 50 })
  maxAiResponses: number;

  @ApiProperty({ example: 1 })
  maxBots: number;

  @ApiProperty({ example: 0 })
  maxTeamMembers: number;

  @ApiProperty({ example: 3 })
  maxKnowledgeFiles: number;

  @ApiProperty({ example: 5 })
  maxKnowledgeSizeMb: number;

  @ApiProperty({ example: true })
  hasBrandingWatermark: boolean;

  @ApiProperty({ example: 1 })
  displayOrder: number;
}
