import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AgentKnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sync knowledge cho agent: delete cũ, insert mới.
   * Validate: knowledge thuộc cùng tenant.
   */
  async syncKnowledge(
    tenantId: string,
    agentId: string,
    knowledgeIds: string[],
  ) {
    // Validate agent thuộc tenant
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, tenantId },
    });
    if (!agent) throw new NotFoundException('Không tìm thấy Bot');

    // Bỏ gán tất cả
    await this.prisma.agentKnowledge.deleteMany({
      where: { agentId },
    });

    if (knowledgeIds.length === 0) {
      return { count: 0 };
    }

    // Validate tất cả knowledge thuộc cùng tenant
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: { id: { in: knowledgeIds }, tenantId },
      select: { id: true },
    });

    if (docs.length !== knowledgeIds.length) {
      throw new ForbiddenException(
        'Một số tài liệu không tồn tại hoặc không thuộc cửa hàng này',
      );
    }

    // Insert mới
    const result = await this.prisma.agentKnowledge.createMany({
      data: knowledgeIds.map((knowledgeId) => ({
        agentId,
        knowledgeId,
      })),
    });

    return { count: result.count };
  }

  /**
   * Lấy list knowledge đang gán cho agent.
   */
  async getAgentKnowledge(tenantId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, tenantId },
    });
    if (!agent) throw new NotFoundException('Không tìm thấy Bot');

    const links = await this.prisma.agentKnowledge.findMany({
      where: { agentId },
      include: {
        knowledge: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            chunkCount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return links.map((link) => ({
      ...link.knowledge,
      assignedAt: link.assignedAt,
    }));
  }
}
