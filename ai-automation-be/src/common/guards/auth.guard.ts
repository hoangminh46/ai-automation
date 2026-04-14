import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma.service.js'; // Đường dẫn có .js (Standard Node ESM của Nest)

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: ReturnType<typeof createClient>;
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.anonKey')!,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<import('express').Request & { user?: any }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu Token hoặc sai định dạng Bearer');
    }

    const token = authHeader.split(' ')[1];

    // Gọi SDK check ngược lên Supabase thay vì tự check tay ở BE.
    // Điều này sẽ bypass mọi rào cản về lỗi đổi thuật toán JWT (ECC/HS256)
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    const payload = data.user;

    // JIT: Đồng bộ dữ liệu User (Seller) từ Supabase Auth sang DB Prisma
    let seller = await this.prisma.seller.findUnique({
      where: { authId: payload.id },
    });

    if (!seller) {
      seller = await this.prisma.seller.create({
        data: {
          authId: payload.id,
          email: payload.email || 'unknown@example.com',
        },
      });
      this.logger.log(`Tự động đăng ký Seller mới: ${seller.email}`);
    }

    // Đính kèm object user vào request để các Controller xài
    request.user = {
      authId: payload.id,
      email: payload.email,
      sellerId: seller.id,
    };

    return true; /* Pass Guard */
  }
}
