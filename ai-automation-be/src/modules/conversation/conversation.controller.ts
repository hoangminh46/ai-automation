import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TestChatDto } from './dto/test-chat.dto.js';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants/:tenantId')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({ summary: 'Gửi tin nhắn cho Bot AI và nhận phản hồi' })
  @Post('chat')
  sendMessage(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationService.sendMessage(user.sellerId, tenantId, dto);
  }

  @ApiOperation({ summary: 'Test Bot — gọi LLM nhưng KHÔNG lưu DB' })
  @Post('chat/test')
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
}
