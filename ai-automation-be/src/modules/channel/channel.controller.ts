import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service.js';
import { ConnectFacebookDto } from './dto/connect-facebook.dto.js';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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

  @ApiOperation({ summary: 'Kết nối Facebook Page' })
  @Post('facebook/connect')
  connectFacebook(
    @Param('tenantId') tenantId: string,
    @Body() dto: ConnectFacebookDto,
  ) {
    return this.channelService.connectFacebookPage(
      tenantId,
      dto.pageId,
      dto.pageAccessToken,
      dto.pageName,
    );
  }

  @ApiOperation({ summary: 'Ngắt kết nối Facebook Page' })
  @Delete('facebook/disconnect')
  disconnectFacebook(@Param('tenantId') tenantId: string) {
    return this.channelService.disconnectFacebookPage(tenantId);
  }
}
