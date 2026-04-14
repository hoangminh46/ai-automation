import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interfaces.js';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    const tenantId = request.params.tenantId;

    if (!tenantId) {
      return true;
    }

    if (!user?.sellerId) {
      throw new ForbiddenException('User not authenticated');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        sellerId: user.sellerId,
      },
    });

    if (!tenant) {
      this.logger.warn(
        `Seller ${user.sellerId} tried to access tenant ${tenantId} they don't own`,
      );
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Attach tenant to request for downstream use
    request.tenant = tenant;
    return true;
  }
}
