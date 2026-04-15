import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchKnowledgeDto {
  @ApiProperty({
    description: 'Câu hỏi cần tìm kiếm',
    example: 'Giá sản phẩm X là bao nhiêu?',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Số chunks trả về (1-10, default 5)',
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  topK?: number;
}
