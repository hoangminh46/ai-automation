import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ConversationService } from './conversation.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TestChatDto } from './dto/test-chat.dto.js';
import { HumanReplyDto } from './dto/human-reply.dto.js';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SanitizeInputPipe } from '../../common/pipes/sanitize-input.pipe.js';
import { PromptInjectionGuardPipe } from '../../common/pipes/prompt-injection-guard.pipe.js';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants/:tenantId')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({ summary: 'Gửi tin nhắn cho Bot AI và nhận phản hồi' })
  @Post('chat')
  @UsePipes(SanitizeInputPipe, PromptInjectionGuardPipe)
  sendMessage(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationService.sendMessage(user.sellerId, tenantId, dto);
  }

  @ApiOperation({
    summary: 'Test Bot — gọi LLM nhưng KHÔNG lưu DB (rate limited)',
  })
  @Post('chat/test')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    short: { ttl: 60000, limit: 5 },
    long: { ttl: 3600000, limit: 30 },
  })
  @UsePipes(SanitizeInputPipe, PromptInjectionGuardPipe)
  testChat(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Body() dto: TestChatDto,
  ) {
    return this.conversationService.testMessage(user.sellerId, tenantId, dto);
  }

  @ApiOperation({ summary: 'Danh sách hội thoại của cửa hàng' })
  @Get('conversations')
  findAll(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
  ) {
    return this.conversationService.findAll(user.sellerId, tenantId);
  }

  @ApiOperation({ summary: 'Lịch sử tin nhắn của một hội thoại' })
  @Get('conversations/:conversationId/messages')
  getMessages(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.getMessages(
      user.sellerId,
      tenantId,
      conversationId,
    );
  }

  @ApiOperation({ summary: 'Đánh dấu hội thoại đã xử lý xong' })
  @Patch('conversations/:conversationId/resolve')
  resolveConversation(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.resolveConversationStatus(
      user.sellerId,
      tenantId,
      conversationId,
    );
  }

  @ApiOperation({
    summary: 'Nhân viên gửi tin nhắn trực tiếp (không qua LLM)',
  })
  @Post('conversations/:conversationId/human-reply')
  @UsePipes(SanitizeInputPipe)
  humanReply(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: HumanReplyDto,
  ) {
    return this.conversationService.humanReply(
      user.sellerId,
      tenantId,
      conversationId,
      dto.content,
    );
  }

  @ApiOperation({
    summary: 'Bàn giao hội thoại cho Bot xử lý tự động',
  })
  @Patch('conversations/:conversationId/handover-bot')
  handoverToBot(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.handoverToBot(
      user.sellerId,
      tenantId,
      conversationId,
    );
  }
}
