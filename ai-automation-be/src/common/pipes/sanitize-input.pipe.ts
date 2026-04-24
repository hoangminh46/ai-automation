import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_CONTENT_REGEX =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const sanitized = { ...value } as Record<string, unknown>;

    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string') {
        let cleaned = sanitized[key];

        // Step 1: Xóa script tags + nội dung bên trong
        cleaned = cleaned.replace(SCRIPT_CONTENT_REGEX, '');

        // Step 2: Xóa HTML tags còn lại
        cleaned = cleaned.replace(HTML_TAG_REGEX, '');

        // Step 3: Trim whitespace thừa
        cleaned = cleaned.trim();

        if (cleaned.length === 0 && sanitized[key].length > 0) {
          throw new BadRequestException(
            `Trường "${key}" chứa nội dung không hợp lệ`,
          );
        }

        sanitized[key] = cleaned;
      }
    }

    return sanitized;
  }
}
