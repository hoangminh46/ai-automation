import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignBotDto {
  @ApiPropertyOptional({
    description: 'ID của bot cần gán. Gửi null để bỏ gán bot.',
    example: '621cd675-3917-4ffb-aaec-5ac8feba8946',
  })
  @IsUUID()
  @IsOptional()
  agentId?: string | null;
}
