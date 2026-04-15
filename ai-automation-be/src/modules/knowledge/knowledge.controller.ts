import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service.js';
import { KnowledgeSearchService } from './services/knowledge-search.service.js';
import { SearchKnowledgeDto } from './dto/search-knowledge.dto.js';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/knowledge')
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly searchService: KnowledgeSearchService,
  ) {}

  @ApiOperation({ summary: 'Upload tài liệu (.txt, .pdf) vào Knowledge Base' })
  @ApiConsumes('multipart/form-data')
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.knowledgeService.uploadDocument(user.sellerId, tenantId, file);
  }

  @ApiOperation({ summary: 'Danh sách tài liệu của cửa hàng' })
  @Get('documents')
  findAll(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
  ) {
    return this.knowledgeService.findAll(user.sellerId, tenantId);
  }

  @ApiOperation({ summary: 'Xoá tài liệu (cascade xoá chunks + vectors)' })
  @Delete('documents/:documentId')
  deleteDocument(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.knowledgeService.deleteDocument(
      user.sellerId,
      tenantId,
      documentId,
    );
  }

  @ApiOperation({
    summary: 'Tìm kiếm knowledge chunks theo semantic similarity',
  })
  @Post('search')
  search(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Body() dto: SearchKnowledgeDto,
  ) {
    // verifyTenantAccess is handled by TenantGuard
    return this.searchService.search(tenantId, dto.query, dto.topK);
  }
}
