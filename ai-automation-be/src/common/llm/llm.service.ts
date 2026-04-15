import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * LlmService: Singleton wrapper quanh OpenAI SDK.
 * Trỏ baseURL vào Gemini OpenAI-compatible endpoint để dùng gemini-2.5-flash.
 * Mọi module cần gọi LLM đều inject LlmService này.
 */
@Injectable()
export class LlmService {
  readonly client: OpenAI;
  readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey')!;
    const baseURL = this.config.get<string>('openai.baseUrl')!;
    this.defaultModel = this.config.get<string>(
      'openai.model',
      'gemini-2.5-flash',
    );

    this.client = new OpenAI({ apiKey, baseURL });
  }

  /**
   * Gọi chat completion (non-streaming).
   * @param messages - Mảng messages theo chuẩn OpenAI ChatCompletionParam
   * @param options - Override model, temperature, max_tokens nếu cần
   */
  async chat(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    },
  ): Promise<OpenAI.Chat.ChatCompletion> {
    return this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 500,
    });
  }
}
