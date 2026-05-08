import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service.js';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AssignBotDto } from './dto/assign-bot.dto.js';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @ApiOperation({ summary: 'Liệt kê các kênh đã kết nối' })
  @Get()
  listChannels(@Param('tenantId') tenantId: string) {
    return this.channelService.listChannels(tenantId);
  }

  @ApiOperation({ summary: 'Gán hoặc bỏ gán bot cho kênh' })
  @Patch(':channelId/assign-bot')
  assignBot(
    @Param('tenantId') tenantId: string,
    @Param('channelId') channelId: string,
    @Body() dto: AssignBotDto,
  ) {
    return this.channelService.assignBot(tenantId, channelId, dto.agentId);
  }

  // ─── Facebook ───────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Lấy URL để redirect seller authorize Facebook Page',
  })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('facebook/auth-url')
  getFacebookAuthUrl(@Param('tenantId') tenantId: string) {
    const url = this.channelService.getFacebookAuthUrl(tenantId);
    return { authUrl: url };
  }

  @ApiOperation({ summary: 'Lấy danh sách Pages đang chờ chọn' })
  @Get('facebook/pending-pages/:sessionId')
  getPendingPages(
    @Param('tenantId') tenantId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.channelService.getPendingPages(sessionId, tenantId);
  }

  @ApiOperation({ summary: 'Chọn Facebook Page từ danh sách' })
  @Post('facebook/select-page')
  selectFacebookPage(
    @Param('tenantId') tenantId: string,
    @Body() body: { sessionId: string; pageId: string },
  ) {
    return this.channelService.selectFacebookPage(
      body.sessionId,
      body.pageId,
      tenantId,
    );
  }

  @ApiOperation({ summary: 'Ngắt kết nối Facebook Page' })
  @Delete('facebook/disconnect')
  disconnectFacebook(@Param('tenantId') tenantId: string) {
    return this.channelService.disconnectFacebookPage(tenantId);
  }

  // ─── Zalo OA ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lấy URL để redirect seller authorize Zalo OA' })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('zalo/auth-url')
  getZaloAuthUrl(@Param('tenantId') tenantId: string) {
    const url = this.channelService.getZaloAuthUrl(tenantId);
    return { authUrl: url };
  }

  @ApiOperation({ summary: 'Ngắt kết nối Zalo OA' })
  @Delete('zalo/disconnect')
  disconnectZalo(@Param('tenantId') tenantId: string) {
    return this.channelService.disconnectZaloOA(tenantId);
  }
}
