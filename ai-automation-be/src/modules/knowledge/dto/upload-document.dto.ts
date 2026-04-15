import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Ghi chú cho tài liệu' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
