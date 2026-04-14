import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants') // Đổi từ tenant sang tenants (số nhiều theo chuẩn REST)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @ApiOperation({ summary: 'Tạo cửa hàng mới' })
  @Post()
  create(
    @CurrentUser() user: { sellerId: string },
    @Body() createTenantDto: CreateTenantDto,
  ) {
    return this.tenantService.create(user.sellerId, createTenantDto);
  }

  @ApiOperation({ summary: 'Lấy danh sách cửa hàng của tôi' })
  @Get()
  findAll(@CurrentUser() user: { sellerId: string }) {
    return this.tenantService.findAll(user.sellerId);
  }

  @ApiOperation({ summary: 'Lấy thông tin chi tiết một cửa hàng' })
  @Get(':id')
  findOne(@CurrentUser() user: { sellerId: string }, @Param('id') id: string) {
    return this.tenantService.findOne(user.sellerId, id);
  }

  @ApiOperation({ summary: 'Cập nhật cửa hàng' })
  @Patch(':id')
  update(
    @CurrentUser() user: { sellerId: string },
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.update(user.sellerId, id, updateTenantDto);
  }
}
