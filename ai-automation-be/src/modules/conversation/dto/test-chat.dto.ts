import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class TestChatHistoryItem {
  @ApiProperty({ enum: ['CUSTOMER', 'BOT'] })
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  content: string;
}

export class TestChatDto {
  @ApiProperty({ description: 'ID của Agent (Bot) cần test' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({
    description: 'Tin nhắn test từ seller',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    description: 'Lịch sử hội thoại trong phiên test (in-memory, không từ DB)',
    type: [TestChatHistoryItem],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TestChatHistoryItem)
  history?: TestChatHistoryItem[];
}
