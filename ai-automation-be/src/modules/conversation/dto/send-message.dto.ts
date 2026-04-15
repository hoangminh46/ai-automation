import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'ID của Agent (Bot) sẽ xử lý tin nhắn' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn từ khách hàng',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    description: 'Tên khách hàng (tự tạo customer nếu chưa có)',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: 'ID khách hàng đã tồn tại' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID hội thoại đã tồn tại (tiếp tục chat)',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}
