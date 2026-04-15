import { Injectable, BadRequestException, Logger } from '@nestjs/common';

/**
 * Extract plain text from uploaded files (TXT, PDF).
 * Plain text files → read as UTF-8.
 * PDF files → parse via pdf-parse library.
 */
@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  async extract(buffer: Buffer, fileType: string): Promise<string> {
    const mimeType = fileType.toLowerCase();

    if (mimeType === 'text/plain' || mimeType === '.txt') {
      return this.extractFromText(buffer);
    }

    if (mimeType === 'application/pdf' || mimeType === '.pdf') {
      return this.extractFromPdf(buffer);
    }

    throw new BadRequestException(
      `File type "${fileType}" không được hỗ trợ. Chỉ chấp nhận .txt và .pdf`,
    );
  }

  private extractFromText(buffer: Buffer): string {
    const text = buffer.toString('utf-8').trim();
    if (!text) {
      throw new BadRequestException('File rỗng, không có nội dung');
    }
    return text;
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const mod = await import('pdf-parse');
      const pdfParse =
        (
          mod as unknown as {
            default: (buf: Buffer) => Promise<{ text: string }>;
          }
        ).default ??
        (mod as unknown as (buf: Buffer) => Promise<{ text: string }>);
      const data = await (
        pdfParse as (buf: Buffer) => Promise<{ text: string }>
      )(buffer);
      const text = data.text?.trim();

      if (!text) {
        throw new BadRequestException(
          'PDF không chứa text (có thể là file scan/ảnh)',
        );
      }

      this.logger.log(`PDF extracted: ${text.length} chars`);
      return text;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(
        `PDF extraction failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new BadRequestException(
        'Không thể đọc file PDF. File có thể bị hỏng.',
      );
    }
  }
}
