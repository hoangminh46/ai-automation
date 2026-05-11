import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QuotaService } from '../plan/quota.service';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private quotaService: QuotaService,
  ) {}

  async create(sellerId: string, createTenantDto: CreateTenantDto) {
    await this.quotaService.checkTenantLimit(sellerId);

    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });
    if (existing) {
      throw new ConflictException('Slug đã tồn tại. Vui lòng chọn slug khác.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          sellerId,
          name: createTenantDto.name,
          slug: createTenantDto.slug,
          members: {
            create: {
              sellerId,
              role: 'OWNER',
            },
          },
          agents: {
            create: {
              name: 'Trợ lý Bán Hàng Mặc Định',
              persona:
                'Bạn là một nhân viên tư vấn bán hàng chuyên nghiệp. Trả lời ngắn gọn, thân thiện, và nhiệt tình bằng tiếng Việt.',
              greeting: 'Xin chào! Tôi có thể giúp gì cho bạn?',
              isDefault: true,
            },
          },
        },
      });
      return tenant;
    });
  }

  async findAll(sellerId: string) {
    return this.prisma.tenant.findMany({
      where: {
        members: { some: { sellerId } },
      },
      include: {
        agents: { select: { id: true, name: true, isActive: true } },
        _count: {
          select: {
            channelConnections: true,
            knowledgeDocuments: true,
            customers: true,
            conversations: true,
          },
        },
      },
    });
  }

  async findOne(sellerId: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, members: { some: { sellerId } } },
      include: { members: true },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy cửa hàng');
    return tenant;
  }

  async update(sellerId: string, id: string, updateTenantDto: UpdateTenantDto) {
    const membership = await this.prisma.tenantMember.findUnique({
      where: { tenantId_sellerId: { tenantId: id, sellerId } },
    });

    if (!membership || membership.role === 'AGENT') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa cửa hàng này');
    }

    if (updateTenantDto.slug) {
      const existing = await this.prisma.tenant.findFirst({
        where: { slug: updateTenantDto.slug, id: { not: id } },
      });
      if (existing) throw new ConflictException('Slug đã được sử dụng');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async getStats(sellerId: string, tenantId: string, days = 30) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, members: { some: { sellerId } } },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy cửa hàng');

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // Step 1: Raw queries for daily aggregations (grouped by date)
    const [conversationsByDay, customersByDay, channelDist, botPerf] =
      await Promise.all([
        this.prisma.conversation.groupBy({
          by: ['createdAt'],
          where: { tenantId, createdAt: { gte: since } },
          _count: true,
        }),
        this.prisma.customer.groupBy({
          by: ['createdAt'],
          where: { tenantId, createdAt: { gte: since } },
          _count: true,
        }),
        this.prisma.conversation.groupBy({
          by: ['channelType'],
          where: { tenantId },
          _count: true,
        }),
        this.prisma.conversation.groupBy({
          by: ['agentId'],
          where: { tenantId, agentId: { not: null } },
          _count: true,
        }),
      ]);

    // Step 2: Aggregate daily counts by date string (YYYY-MM-DD)
    const convMap = new Map<string, number>();
    for (const row of conversationsByDay) {
      const key = row.createdAt.toISOString().slice(0, 10);
      convMap.set(key, (convMap.get(key) || 0) + row._count);
    }

    const custMap = new Map<string, number>();
    for (const row of customersByDay) {
      const key = row.createdAt.toISOString().slice(0, 10);
      custMap.set(key, (custMap.get(key) || 0) + row._count);
    }

    // Step 3: Fill missing days with 0 (includes today)
    const dailyConversations: { date: string; count: number }[] = [];
    const dailyCustomers: { date: string; count: number }[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyConversations.push({ date: key, count: convMap.get(key) || 0 });
      dailyCustomers.push({ date: key, count: custMap.get(key) || 0 });
    }

    // Step 4: Resolve agent names for bot performance
    const agentIds = botPerf
      .map((r) => r.agentId)
      .filter((id): id is string => !!id);
    const agents =
      agentIds.length > 0
        ? await this.prisma.agent.findMany({
            where: { id: { in: agentIds } },
            select: { id: true, name: true },
          })
        : [];
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    return {
      dailyConversations,
      dailyCustomers,
      channelDistribution: channelDist.map((r) => ({
        channel: r.channelType || 'UNKNOWN',
        count: r._count,
      })),
      botPerformance: botPerf.map((r) => ({
        botId: r.agentId,
        botName: agentMap.get(r.agentId!) || 'Không rõ',
        count: r._count,
      })),
    };
  }
}
