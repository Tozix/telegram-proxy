import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { AuthUser, JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTokenResponseDto } from './dto/api-token-response.dto';
import { CreatedApiTokenDto } from './dto/created-api-token.dto';

/** Срок жизни статического токена — фактически "вечный" (см. README). */
const STATIC_TOKEN_EXPIRES_IN = '999y';

@Injectable()
export class ApiTokensService {
  private readonly logger = new Logger(ApiTokensService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Выпускает статический токен для пользователя. Токен — это JWT с теми же
   * полями (`sub`/`email`/`role`), что и обычный логин-токен, но с 999-летним
   * сроком и claim `jti`, равным id строки в БД (по нему токен можно отозвать).
   * Значение токена возвращается единственный раз.
   */
  async create(actor: AuthUser, name: string): Promise<CreatedApiTokenDto> {
    const id = randomUUID();
    const payload: JwtPayload = { sub: actor.userId, email: actor.email, role: actor.role };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: STATIC_TOKEN_EXPIRES_IN,
      jwtid: id,
    });

    const decoded = this.jwt.decode(token) as { exp: number };
    const row = await this.prisma.apiToken.create({
      data: { id, userId: actor.userId, name, expiresAt: new Date(decoded.exp * 1000) },
    });
    this.logger.log(`Issued static API token "${name}" (${id}) for ${actor.email}`);
    return CreatedApiTokenDto.from(row, token);
  }

  /** Токены текущего пользователя (свежие сверху). */
  async list(actor: AuthUser): Promise<ApiTokenResponseDto[]> {
    const rows = await this.prisma.apiToken.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ApiTokenResponseDto.from(r));
  }

  /** Отзывает токен (удаляет строку). 404 для чужого/несуществующего токена. */
  async revoke(actor: AuthUser, id: string): Promise<void> {
    const row = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!row || row.userId !== actor.userId) {
      throw new NotFoundException('Токен не найден');
    }
    await this.prisma.apiToken.delete({ where: { id } });
  }

  /**
   * Проверка статического токена на каждом запросе (вызывается из JwtStrategy,
   * когда в payload есть `jti`). Если строки нет — токен отозван. Заодно
   * отмечает время последнего использования (без блокировки запроса).
   */
  async assertActive(jti: string): Promise<void> {
    const row = await this.prisma.apiToken.findUnique({ where: { id: jti } });
    if (!row) {
      throw new UnauthorizedException('Статический токен отозван');
    }
    void this.prisma.apiToken
      .update({ where: { id: jti }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }
}
