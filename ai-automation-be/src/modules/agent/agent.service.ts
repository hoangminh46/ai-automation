import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  private async verifyTenantAccess(tenantId: string, sellerId: string) {
    const membership = await this.prisma.tenantMember.findFirst({
      where: { tenantId, sellerId, isActive: true },
    });
    if (!membership) {
      throw new ForbiddenException('Bạn không có quyền truy cập cửa hàng này');
    }
    return membership;
  }

  async create(
    sellerId: string,
    tenantId: string,
    createAgentDto: CreateAgentDto,
  ) {
    const membership = await this.verifyTenantAccess(tenantId, sellerId);
    if (membership.role === 'AGENT') {
      throw new ForbiddenException('Nhân sự không có quyền tạo Bot mới');
    }

    return this.prisma.agent.create({
      data: {
        tenantId,
        ...createAgentDto,
      },
    });
  }

  async findAll(sellerId: string, tenantId: string) {
    await this.verifyTenantAccess(tenantId, sellerId);
    return this.prisma.agent.findMany({
      where: { tenantId },
      include: { tools: true },
    });
  }

  async findOne(sellerId: string, tenantId: string, id: string) {
    await this.verifyTenantAccess(tenantId, sellerId);
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      include: { tools: true },
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

    return this.prisma.agent.update({
      where: { id, tenantId },
      data: updateAgentDto,
    });
  }

  async remove(sellerId: string, tenantId: string, id: string) {
    const membership = await this.verifyTenantAccess(tenantId, sellerId);
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Owner/Admin mới có quyền xóa Bot');
    }

    return this.prisma.agent.delete({
      where: { id, tenantId },
    });
  }
}
