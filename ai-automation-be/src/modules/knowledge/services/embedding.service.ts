import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

/**
 * Embedding service dùng Gemini gemini-embedding-001.
 * Batch embed nhiều chunks cùng lúc, retry khi API fail.
 * Output truncated xuống 1536 dimensions (MRL) để khớp pgvector schema.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    // Dùng cùng API key với LLM chat (Gemini key lưu trong OPENAI_API_KEY)
    const apiKey = this.config.get<string>('openai.apiKey')!;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Embed một text đơn lẻ → vector 1536 dimensions.
   */
  async embedOne(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  /**
   * Batch embed nhiều texts → mảng vectors.
   * Chia thành batches nhỏ (BATCH_SIZE) để tránh rate limit.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const embeddings = await this.embedWithRetry(batch);
      allEmbeddings.push(...embeddings);

      // Rate limit throttle: đợi 200ms giữa các batches
      if (i + BATCH_SIZE < texts.length) {
        await this.sleep(200);
      }
    }

    this.logger.log(
      `Embedded ${texts.length} chunks → ${allEmbeddings.length} vectors (${EMBEDDING_DIMENSIONS}d)`,
    );

    return allEmbeddings;
  }

  private async embedWithRetry(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const results: number[][] = [];

        // Gemini SDK: embed từng text một (batchEmbedContents chưa stable)
        for (const text of texts) {
          const result = await model.embedContent({
            content: { parts: [{ text }], role: 'user' },
          });
          let values = result.embedding.values;

          // Truncate dimensions nếu model trả về > 1536 (MRL)
          if (values.length > EMBEDDING_DIMENSIONS) {
            values = values.slice(0, EMBEDDING_DIMENSIONS);
          }

          results.push(values);
        }

        return results;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Embedding attempt ${attempt}/${MAX_RETRIES} failed: ${errMsg}`,
        );

        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Embedding failed after ${MAX_RETRIES} retries: ${errMsg}`,
          );
        }

        // Exponential backoff: 1s, 2s, 4s
        await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    throw new Error('Unreachable');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
