import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentKnowledgeService } from './agent-knowledge.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AssignKnowledgeDto } from './dto/assign-knowledge.dto';
import { SupabaseAuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly agentKnowledgeService: AgentKnowledgeService,
  ) {}

  @ApiOperation({ summary: 'Tạo bot AI mới cho cửa hàng' })
  @Post()
  create(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentService.create(user.sellerId, tenantId, createAgentDto);
  }

  @ApiOperation({ summary: 'Lấy toàn bộ bot của một cửa hàng' })
  @Get()
  findAll(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
  ) {
    return this.agentService.findAll(user.sellerId, tenantId);
  }

  @ApiOperation({ summary: 'Xem chi tiết một bot' })
  @Get(':id')
  findOne(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.agentService.findOne(user.sellerId, tenantId, id);
  }

  @ApiOperation({ summary: 'Sửa cấu hình Bot (Persona, model, ...)' })
  @Patch(':id')
  update(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentService.update(
      user.sellerId,
      tenantId,
      id,
      updateAgentDto,
    );
  }

  @ApiOperation({ summary: 'Xóa Bot' })
  @Delete(':id')
  remove(
    @CurrentUser() user: { sellerId: string },
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.agentService.remove(user.sellerId, tenantId, id);
  }

  // ─── Knowledge N:M ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Gán knowledge cho bot (sync toàn bộ)' })
  @Put(':agentId/knowledge')
  syncKnowledge(
    @Param('tenantId') tenantId: string,
    @Param('agentId') agentId: string,
    @Body() dto: AssignKnowledgeDto,
  ) {
    return this.agentKnowledgeService.syncKnowledge(
      tenantId,
      agentId,
      dto.knowledgeIds,
    );
  }

  @ApiOperation({ summary: 'Lấy danh sách knowledge đang gán cho bot' })
  @Get(':agentId/knowledge')
  getAgentKnowledge(
    @Param('tenantId') tenantId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.agentKnowledgeService.getAgentKnowledge(tenantId, agentId);
  }
}
