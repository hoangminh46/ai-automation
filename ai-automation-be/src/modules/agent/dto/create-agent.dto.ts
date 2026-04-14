import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 'Trợ lý Bán Hàng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Bạn là nhân viên tư vấn bán hàng quần áo...',
  })
  @IsString()
  @IsOptional()
  persona?: string;

  @ApiPropertyOptional({ example: 'Xin chào, tôi có thể giúp gì cho bạn?' })
  @IsString()
  @IsOptional()
  greeting?: string;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 0.7 })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(1)
  @Max(4000)
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
