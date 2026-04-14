import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

interface RequestWithTenant {
  user?: { sellerId?: string };
  params: { tenantId?: string; id?: string };
  tenant?: unknown;
  membership?: unknown;
}

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user;
    const tenantId = request.params.tenantId || request.params.id;

    if (!tenantId) {
      return true;
    }

    if (!user?.sellerId) {
      throw new ForbiddenException('User not authenticated');
    }
    const sellerId = user.sellerId;

    const membership = await this.prisma.tenantMember.findFirst({
      where: {
        tenantId,
        sellerId,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      this.logger.warn(
        `Seller ${sellerId} access denied for tenant ${tenantId}`,
      );
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Attach tenant and membership to request for downstream use
    request.tenant = membership.tenant;
    request.membership = membership;

    return true;
  }
}
