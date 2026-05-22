import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from './jwt.strategy';

/**
 * Allows only `admin` users. Use AFTER {@link JwtAuthGuard} so `req.user` is set:
 * `@UseGuards(JwtAuthGuard, AdminGuard)`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Требуются права администратора');
    }
    return true;
  }
}
