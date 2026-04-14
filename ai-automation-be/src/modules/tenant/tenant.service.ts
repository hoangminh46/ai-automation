import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, createTenantDto: CreateTenantDto) {
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
}
