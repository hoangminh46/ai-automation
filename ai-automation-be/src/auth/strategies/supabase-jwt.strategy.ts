import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service.js';
import {
  JwtPayload,
  AuthenticatedUser,
} from '../interfaces/auth.interfaces.js';

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  private readonly logger = new Logger(SupabaseJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('supabase.url')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `${supabaseUrl}/auth/v1`,
      // FIXED: Phải sử dụng JWT Secret để giải mã thay vì Anon Key
      secretOrKey: process.env.SUPABASE_JWT_SECRET!,
      algorithms: ['HS256'] as const,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    let seller = await this.prisma.seller.findUnique({
      where: { authId: payload.sub },
    });

    if (!seller) {
      seller = await this.prisma.seller.create({
        data: {
          authId: payload.sub,
          email: payload.email,
        },
      });
      this.logger.log(`Auto-registered new seller: ${seller.email}`);
    }

    return {
      authId: payload.sub,
      email: payload.email,
      sellerId: seller.id,
    };
  }
}
