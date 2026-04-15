import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { TextExtractorService } from './services/text-extractor.service.js';
import { TextChunkerService } from './services/text-chunker.service.js';
import { EmbeddingService } from './services/embedding.service.js';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/plain', 'application/pdf'];

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: TextExtractorService,
    private readonly chunker: TextChunkerService,
    private readonly embedding: EmbeddingService,
  ) {}

  private async verifyTenantAccess(tenantId: string, sellerId: string) {
    const membership = await this.prisma.tenantMember.findFirst({
      where: { tenantId, sellerId, isActive: true },
    });
    if (!membership) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }
  }

  /**
   * Upload document: validate → create record → extract → chunk → embed → store vectors.
   * Pipeline xử lý sync trong request (file ≤ 10MB).
   */
  async uploadDocument(
    sellerId: string,
    tenantId: string,
    file: Express.Multer.File,
  ) {
    await this.verifyTenantAccess(tenantId, sellerId);

    // Step 1: Validate file
    if (!file || !file.buffer) {
      throw new BadRequestException('Không tìm thấy file upload');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB.`,
      );
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Loại file "${file.mimetype}" không hỗ trợ. Chỉ chấp nhận .txt và .pdf`,
      );
    }

    // Step 2: Create document record (PENDING)
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        tenantId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        status: 'PENDING',
      },
    });

    try {
      // Step 3: Update status → PROCESSING
      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: { status: 'PROCESSING' },
      });

      // Step 4: Extract text
      this.logger.log(
        `[Upload] Extracting text from "${file.originalname}" (${file.mimetype})`,
      );
      const rawText = await this.extractor.extract(file.buffer, file.mimetype);

      // Step 5: Chunk text
      const chunks = this.chunker.chunk(rawText);
      this.logger.log(
        `[Upload] Chunked into ${chunks.length} pieces (from ${rawText.length} chars)`,
      );

      // Step 6: Embed all chunks
      const chunkTexts = chunks.map((c) => c.content);
      const vectors = await this.embedding.embedBatch(chunkTexts);

      // Step 7: Insert chunks + vectors vào pgvector (raw SQL vì Prisma không hỗ trợ vector type)
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = randomUUID();
        const embeddingStr = `[${vectors[i].join(',')}]`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, document_id, content, embedding, chunk_index, metadata, created_at)
           VALUES ($1, $2, $3, $4::vector, $5, $6::jsonb, NOW())`,
          chunkId,
          document.id,
          chunks[i].content,
          embeddingStr,
          chunks[i].index,
          JSON.stringify({}),
        );
      }

      // Step 8: Update document status → READY
      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: 'READY',
          chunkCount: chunks.length,
        },
      });

      this.logger.log(
        `[Upload] Document "${file.originalname}" processed: ${chunks.length} chunks embedded`,
      );

      return this.prisma.knowledgeDocument.findUnique({
        where: { id: document.id },
      });
    } catch (error) {
      // On error: mark document as ERROR
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: 'ERROR',
          errorMessage,
        },
      });

      this.logger.error(`[Upload] Failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Danh sách documents của tenant (sorted by newest first).
   */
  async findAll(sellerId: string, tenantId: string) {
    await this.verifyTenantAccess(tenantId, sellerId);

    return this.prisma.knowledgeDocument.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        errorMessage: true,
        chunkCount: true,
        createdAt: true,
      },
    });
  }

  /**
   * Xoá document + cascade delete chunks (Prisma onDelete: Cascade handles this).
   */
  async deleteDocument(sellerId: string, tenantId: string, documentId: string) {
    await this.verifyTenantAccess(tenantId, sellerId);

    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    await this.prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });

    this.logger.log(
      `[Delete] Document "${doc.fileName}" deleted (${doc.chunkCount} chunks)`,
    );

    return { message: `Đã xoá "${doc.fileName}"` };
  }
}
