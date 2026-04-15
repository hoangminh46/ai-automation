import { Injectable } from '@nestjs/common';

interface ChunkResult {
  content: string;
  index: number;
}

/**
 * Recursive text splitter — chia văn bản thành chunks nhỏ
 * sử dụng hierarchy separators: paragraph → line → sentence → word.
 * Overlap giữa các chunks để không mất ngữ cảnh tại ranh giới.
 */
@Injectable()
export class TextChunkerService {
  private readonly separators = ['\n\n', '\n', '. ', ' '];

  chunk(text: string, maxChars = 1500, overlapChars = 200): ChunkResult[] {
    const cleanedText = text.replace(/\r\n/g, '\n').trim();

    if (cleanedText.length <= maxChars) {
      return [{ content: cleanedText, index: 0 }];
    }

    const rawChunks = this.recursiveSplit(cleanedText, maxChars);
    return this.applyOverlap(rawChunks, overlapChars);
  }

  private recursiveSplit(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text];

    for (const separator of this.separators) {
      const parts = text.split(separator);
      if (parts.length <= 1) continue;

      const chunks: string[] = [];
      let current = '';

      for (const part of parts) {
        const candidate = current ? current + separator + part : part;

        if (candidate.length > maxChars && current) {
          chunks.push(current);
          current = part;
        } else {
          current = candidate;
        }
      }

      if (current) chunks.push(current);

      // Nếu vẫn có chunk > maxChars → recursive split với separator tiếp theo
      const result: string[] = [];
      for (const chunk of chunks) {
        if (chunk.length > maxChars) {
          result.push(...this.recursiveSplit(chunk, maxChars));
        } else {
          result.push(chunk);
        }
      }

      return result;
    }

    // Fallback: hard split theo maxChars (hiếm khi xảy ra — chỉ khi 1 từ > maxChars)
    const result: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      result.push(text.slice(i, i + maxChars));
    }
    return result;
  }

  private applyOverlap(chunks: string[], overlapChars: number): ChunkResult[] {
    if (overlapChars <= 0) {
      return chunks.map((content, index) => ({
        content: content.trim(),
        index,
      }));
    }

    const results: ChunkResult[] = [];
    for (let i = 0; i < chunks.length; i++) {
      let content = chunks[i];

      // Prepend overlap từ chunk trước
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const overlapText = prevChunk.slice(-overlapChars);
        content = overlapText + content;
      }

      results.push({ content: content.trim(), index: i });
    }

    return results;
  }
}
