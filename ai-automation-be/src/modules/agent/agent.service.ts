import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { QuotaService } from '../plan/quota.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotaService: QuotaService,
  ) {}

  private async verifyTenantAccess(tenantId: string, sellerId: string) {
    const membership = await this.prisma.tenantMember.findFirst({
      where: { tenantId, sellerId, isActive: true },
    });
    if (!membership) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }
    return membership;
  }

  // Include relations mới cho response đầy đủ
  private readonly agentInclude = {
    tools: true,
    channels: {
      select: {
        id: true,
        channelType: true,
        externalName: true,
        isActive: true,
      },
    },
    knowledgeLinks: {
      include: {
        knowledge: {
          select: {
            id: true,
            fileName: true,
            status: true,
          },
        },
      },
    },
  };

  async create(
    sellerId: string,
    tenantId: string,
    createAgentDto: CreateAgentDto,
  ) {
    const membership = await this.verifyTenantAccess(tenantId, sellerId);
    if (membership.role === 'AGENT') {
      throw new ForbiddenException('Nhân sự không có quyền tạo Bot mới');
    }

    await this.quotaService.checkBotLimit(sellerId);

    const { channelIds, ...agentData } = createAgentDto;

    const agent = await this.prisma.agent.create({
      data: {
        tenantId,
        ...agentData,
      },
      include: this.agentInclude,
    });

    if (channelIds?.length) {
      await this.syncChannels(tenantId, agent.id, channelIds);
      return this.prisma.agent.findUniqueOrThrow({
        where: { id: agent.id },
        include: this.agentInclude,
      });
    }

    return agent;
  }

  async findAll(sellerId: string, tenantId: string) {
    await this.verifyTenantAccess(tenantId, sellerId);
    return this.prisma.agent.findMany({
      where: { tenantId },
      include: this.agentInclude,
    });
  }

  async findOne(sellerId: string, tenantId: string, id: string) {
    await this.verifyTenantAccess(tenantId, sellerId);
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      include: this.agentInclude,
    });
    if (!agent) throw new NotFoundException('Không tìm thấy Bot');
    return agent;
  }

  async update(
    sellerId: string,
    tenantId: string,
    id: string,
    updateAgentDto: UpdateAgentDto,
  ) {
    const membership = await this.verifyTenantAccess(tenantId, sellerId);
    if (membership.role === 'AGENT') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa Bot');
    }

    const { channelIds, ...agentData } = updateAgentDto;

    // Update agent fields (nếu có)
    if (Object.keys(agentData).length > 0) {
      await this.prisma.agent.update({
        where: { id, tenantId },
        data: agentData,
      });
    }

    // Sync channels nếu truyền channelIds
    if (channelIds !== undefined) {
      await this.syncChannels(tenantId, id, channelIds);
    }

    return this.prisma.agent.findUniqueOrThrow({
      where: { id },
      include: this.agentInclude,
    });
  }

  /**
   * Sync channels cho agent: bỏ gán cũ, gán mới.
   * Validate: channels thuộc cùng tenant, channels chưa gán bot khác.
   */
  private async syncChannels(
    tenantId: string,
    agentId: string,
    channelIds: string[],
  ) {
    if (channelIds.length === 0) {
      // Bỏ gán tất cả channels
      await this.prisma.channelConnection.updateMany({
        where: { agentId },
        data: { agentId: null },
      });
      return;
    }

    // Validate tất cả channels thuộc cùng tenant
    const channels = await this.prisma.channelConnection.findMany({
      where: { id: { in: channelIds }, tenantId },
    });

    if (channels.length !== channelIds.length) {
      throw new ForbiddenException(
        'Một số kênh không tồn tại hoặc không thuộc cửa hàng này',
      );
    }

    // Validate channels chưa gán bot khác
    const assignedToOther = channels.filter(
      (ch) => ch.agentId && ch.agentId !== agentId,
    );
    if (assignedToOther.length > 0) {
      const names = assignedToOther
        .map((ch) => ch.externalName || ch.id)
        .join(', ');
      throw new ForbiddenException(
        `Các kênh đã gán bot khác: ${names}. Vui lòng bỏ gán trước.`,
      );
    }

    // Bỏ gán channels cũ của agent này
    await this.prisma.channelConnection.updateMany({
      where: { agentId },
      data: { agentId: null },
    });

    // Gán channels mới
    await this.prisma.channelConnection.updateMany({
      where: { id: { in: channelIds } },
      data: { agentId },
    });
  }

  async remove(sellerId: string, tenantId: string, id: string) {
    const membership = await this.verifyTenantAccess(tenantId, sellerId);
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Owner/Admin mới có quyền xóa Bot');
    }

    // Rule 3: Bot mặc định không thể xoá
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
    });
    if (!agent) throw new NotFoundException('Không tìm thấy Bot');

    if (agent.isDefault) {
      throw new ForbiddenException('Không thể xoá bot mặc định');
    }

    // Rule 4: Unlink channels trước khi xoá (set agentId = null)
    // Schema đã có onDelete: SetNull nhưng explicit unlink để rõ ràng
    await this.prisma.channelConnection.updateMany({
      where: { agentId: id },
      data: { agentId: null },
    });

    return this.prisma.agent.delete({
      where: { id, tenantId },
    });
  }
}
