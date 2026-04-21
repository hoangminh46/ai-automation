import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HumanReplyDto {
  @ApiProperty({
    description: 'Nội dung tin nhắn từ nhân viên hỗ trợ',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
