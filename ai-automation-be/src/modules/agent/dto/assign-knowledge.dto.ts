import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignKnowledgeDto {
  @ApiProperty({
    description:
      'IDs của knowledge documents cần gán cho bot. Gửi [] để bỏ gán tất cả.',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  knowledgeIds: string[];
}
