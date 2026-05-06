import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import type { Plan } from '@prisma/client';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trả danh sách plans đang active, sắp xếp theo displayOrder.
   * Cache-friendly: plans ít thay đổi, CMS sẽ quản lý sau.
   */
  async findAllActive(): Promise<Plan[]> {
    return await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Tìm plan theo slug (free, basic, standard, premium).
   * Throw nếu không tìm thấy — plan slugs là cố định.
   */
  async findBySlug(slug: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({
      where: { slug },
    });
    if (!plan) {
      throw new Error(
        `Plan with slug "${slug}" not found. Run seed script first.`,
      );
    }
    return plan;
  }
}
