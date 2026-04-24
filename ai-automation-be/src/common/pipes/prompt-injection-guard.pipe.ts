import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';

/**
 * Patterns phổ biến mà attacker dùng để override LLM system prompt.
 * Kiểm tra trên message/content field trước khi gửi đến LLM pipeline.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/i,
  /forget\s+(all\s+)?(your\s+)?instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+a/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /override\s+(your\s+)?(system|instructions?|persona)/i,
  /act\s+as\s+(if\s+you\s+(are|were)|a\s+different)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /do\s+anything\s+now/i,
  /pretend\s+you\s+(are|have)\s+no\s+(restrictions?|rules?|limits?)/i,
];

@Injectable()
export class PromptInjectionGuardPipe implements PipeTransform {
  private readonly logger = new Logger(PromptInjectionGuardPipe.name);

  transform(value: unknown): unknown {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const body = value as Record<string, unknown>;

    // Chỉ scan field chứa text gửi đến LLM (message, content)
    const fieldsToCheck = ['message', 'content'];

    for (const field of fieldsToCheck) {
      if (typeof body[field] !== 'string') continue;

      const text = body[field];

      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          this.logger.warn(
            `🛡️ Prompt injection detected — field: "${field}", pattern: ${pattern.source}, text preview: "${text.slice(0, 100)}"`,
          );
          throw new BadRequestException(
            'Tin nhắn chứa nội dung không được phép. Vui lòng thử lại.',
          );
        }
      }
    }

    return value;
  }
}
