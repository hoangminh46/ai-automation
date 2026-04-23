import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectFacebookDto {
  @ApiProperty({ description: 'Facebook Page ID', example: '55454061255579' })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({ description: 'Facebook Page Access Token' })
  @IsString()
  @IsNotEmpty()
  pageAccessToken: string;

  @ApiPropertyOptional({
    description: 'Tên Page hiển thị',
    example: 'Shop ABC',
  })
  @IsString()
  @IsOptional()
  pageName?: string;
}
