import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service.js';
import { EmbeddingService } from './embedding.service.js';

const DEFAULT_TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.3;

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  documentId: string;
}

/**
 * Semantic search trên pgvector — embed query → cosine similarity → top-K chunks.
 * Pre-filter by tenant_id để đảm bảo multi-tenant isolation.
 */
@Injectable()
export class KnowledgeSearchService {
  private readonly logger = new Logger(KnowledgeSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  /**
   * Search knowledge chunks theo semantic similarity.
   * @returns Top-K chunks sorted by relevance, chỉ lấy similarity > threshold
   */
  async search(
    tenantId: string,
    query: string,
    topK = DEFAULT_TOP_K,
  ): Promise<SearchResult[]> {
    // Step 1: Embed query
    const queryVector = await this.embedding.embedOne(query);
    const embeddingStr = `[${queryVector.join(',')}]`;

    // Step 2: pgvector cosine similarity search (pre-filtered by tenant)
    const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
      `SELECT
        kc.id,
        kc.content,
        kc.document_id AS "documentId",
        1 - (kc.embedding <=> $1::vector) AS similarity
      FROM knowledge_chunks kc
      INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kd.tenant_id = $2
        AND kd.status = 'READY'
        AND 1 - (kc.embedding <=> $1::vector) > $3
      ORDER BY kc.embedding <=> $1::vector
      LIMIT $4`,
      embeddingStr,
      tenantId,
      SIMILARITY_THRESHOLD,
      topK,
    );

    if (results.length > 0) {
      this.logger.log(
        `[Search] tenant=${tenantId} query="${query.slice(0, 50)}..." → ${results.length} chunks (top=${results[0].similarity.toFixed(3)})`,
      );
    }

    return results;
  }

  /**
   * Build knowledge context string để inject vào system prompt.
   * Trả về null nếu không tìm thấy chunks liên quan.
   */
  async buildKnowledgeContext(
    tenantId: string,
    query: string,
  ): Promise<string | null> {
    const chunks = await this.search(tenantId, query);

    if (chunks.length === 0) return null;

    const contextParts = chunks.map(
      (chunk, i) => `[${i + 1}] ${chunk.content}`,
    );

    return contextParts.join('\n---\n');
  }
}
