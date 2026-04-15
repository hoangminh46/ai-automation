import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  reply: string;

  @ApiProperty()
  agentName: string;

  @ApiProperty({ description: 'Token usage cho request này' })
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
