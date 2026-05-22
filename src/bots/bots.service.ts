import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import type { Bot } from '../../generated/prisma/client';
import { randomBytes } from 'node:crypto';
import type { AuthUser } from '../auth/jwt.strategy';
import { buildMeta } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TelegramService } from '../telegram/telegram.service';
import { BotResponseDto } from './dto/bot-response.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { PaginatedBotsDto } from './dto/paginated-bots.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { WebhookInfoDto } from './dto/webhook-info.dto';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);
  private readonly publicBaseUrl: string;
  private readonly tokenCacheTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.publicBaseUrl = config.get<string>('publicBaseUrl')!;
    this.tokenCacheTtlSeconds = config.get<number>('redis.tokenCacheTtlSeconds')!;
  }

  // ----- public API (returns DTOs) -----

  async create(dto: CreateBotDto, actor: AuthUser): Promise<BotResponseDto> {
    const existing = await this.prisma.bot.findUnique({ where: { token: dto.token } });
    if (existing) {
      throw new ConflictException('Бот с таким токеном уже зарегистрирован');
    }

    // Validate the token and capture the bot identity.
    const me = await this.telegram.getMe(dto.token);

    let bot = await this.prisma.bot.create({
      data: {
        userId: actor.userId,
        name: dto.name,
        token: dto.token,
        telegramBotId: me.id != null ? BigInt(me.id) : null,
        username: me.username ?? null,
        webhookSecret: this.generateSecret(),
        targetWebhookUrl: dto.targetWebhookUrl,
        allowedUpdates: dto.allowedUpdates ?? Prisma.DbNull,
        isActive: true,
      },
    });
    await this.invalidateTokenCache();

    bot = await this.registerWebhook(bot, dto.dropPendingUpdates ?? false);
    return this.toDto(bot);
  }

  async findAll(limit: number, offset: number, actor: AuthUser): Promise<PaginatedBotsDto> {
    const where: Prisma.BotWhereInput = actor.role === 'admin' ? {} : { userId: actor.userId };
    const [bots, total] = await this.prisma.$transaction([
      this.prisma.bot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.bot.count({ where }),
    ]);
    return { ...buildMeta(total, limit, offset), items: bots.map((b) => this.toDto(b)) };
  }

  async findOne(id: string, actor: AuthUser): Promise<BotResponseDto> {
    return this.toDto(await this.getEntity(id, actor));
  }

  async update(id: string, dto: UpdateBotDto, actor: AuthUser): Promise<BotResponseDto> {
    const bot = await this.getEntity(id, actor);

    const webhookAffecting =
      (dto.token !== undefined && dto.token !== bot.token) ||
      (dto.targetWebhookUrl !== undefined && dto.targetWebhookUrl !== bot.targetWebhookUrl) ||
      dto.allowedUpdates !== undefined;

    const data: Prisma.BotUpdateInput = {};

    if (dto.token !== undefined && dto.token !== bot.token) {
      const clash = await this.prisma.bot.findUnique({ where: { token: dto.token } });
      if (clash && clash.id !== bot.id) {
        throw new ConflictException('Бот с таким токеном уже зарегистрирован');
      }
      const me = await this.telegram.getMe(dto.token);
      data.token = dto.token;
      data.telegramBotId = me.id != null ? BigInt(me.id) : null;
      data.username = me.username ?? null;
    }

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.targetWebhookUrl !== undefined) data.targetWebhookUrl = dto.targetWebhookUrl;
    if (dto.allowedUpdates !== undefined) data.allowedUpdates = dto.allowedUpdates ?? Prisma.DbNull;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    let updated = await this.prisma.bot.update({ where: { id }, data });
    await this.invalidateTokenCache();

    if (dto.isActive === false) {
      await this.safeDeleteWebhook(updated);
    } else if (webhookAffecting || dto.isActive === true) {
      updated = await this.registerWebhook(updated, false);
    }

    return this.toDto(updated);
  }

  async remove(id: string, actor: AuthUser, dropPendingUpdates = false): Promise<void> {
    const bot = await this.getEntity(id, actor);
    await this.safeDeleteWebhook(bot, dropPendingUpdates);
    await this.prisma.bot.delete({ where: { id } });
    await this.invalidateTokenCache();
  }

  async refreshWebhook(id: string, actor: AuthUser, dropPendingUpdates = false): Promise<BotResponseDto> {
    const bot = await this.registerWebhook(await this.getEntity(id, actor), dropPendingUpdates);
    return this.toDto(bot);
  }

  async getWebhookInfo(id: string, actor: AuthUser): Promise<WebhookInfoDto> {
    const bot = await this.getEntity(id, actor);
    return WebhookInfoDto.from(await this.telegram.getWebhookInfo(bot.token));
  }

  // ----- internal API (returns entities) -----

  /** Loads a bot, enforcing ownership unless the actor is an admin. */
  async getEntity(id: string, actor?: AuthUser): Promise<Bot> {
    const bot = await this.prisma.bot.findUnique({ where: { id } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (actor && actor.role !== 'admin' && bot.userId !== actor.userId) {
      throw new NotFoundException('Бот не найден'); // hide existence from non-owners
    }
    return bot;
  }

  findByWebhookSecret(secret: string): Promise<Bot | null> {
    return this.prisma.bot.findUnique({ where: { webhookSecret: secret } });
  }

  /**
   * Used by the transparent proxy's open-relay guard on every Bot API request,
   * so it must be cheap. Answers from a short-lived Redis cache (shared across
   * instances, survives restarts); on a miss or if Redis is down it falls back
   * to a DB count, which is always authoritative.
   */
  async isRegisteredToken(token: string): Promise<boolean> {
    const cacheKey = this.redis.key('reg', token);
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return cached === '1';

    const exists = (await this.prisma.bot.count({ where: { token } })) > 0;
    await this.redis.set(cacheKey, exists ? '1' : '0', this.tokenCacheTtlSeconds);
    return exists;
  }

  // ----- helpers -----

  private toDto(bot: Bot): BotResponseDto {
    return BotResponseDto.from(bot, this.publicBaseUrl);
  }

  /** The `allowed_updates` jsonb column, narrowed back to its app-level shape. */
  private allowed(bot: Bot): string[] | null {
    return (bot.allowedUpdates as string[] | null) ?? null;
  }

  /** Registers our public webhook URL with Telegram and records the outcome. */
  private async registerWebhook(bot: Bot, dropPendingUpdates: boolean): Promise<Bot> {
    const url = `${this.publicBaseUrl}/webhook/${bot.webhookSecret}`;
    let lastWebhookSetAt = bot.lastWebhookSetAt;
    let webhookError = bot.webhookError;
    try {
      await this.telegram.setWebhook(bot.token, {
        url,
        secretToken: bot.webhookSecret,
        allowedUpdates: this.allowed(bot),
        dropPendingUpdates,
      });
      lastWebhookSetAt = new Date();
      webhookError = null;
      this.logger.log(`Webhook set for bot ${bot.id} (${bot.username ?? bot.name}) -> ${url}`);
    } catch (err) {
      webhookError = (err as Error).message;
      this.logger.warn(`Failed to set webhook for bot ${bot.id}: ${webhookError}`);
    }
    return this.prisma.bot.update({
      where: { id: bot.id },
      data: { lastWebhookSetAt, webhookError },
    });
  }

  private async safeDeleteWebhook(bot: Bot, dropPendingUpdates = false): Promise<void> {
    try {
      await this.telegram.deleteWebhook(bot.token, dropPendingUpdates);
    } catch (err) {
      this.logger.warn(`Failed to delete webhook for bot ${bot.id}: ${(err as Error).message}`);
    }
  }

  private generateSecret(): string {
    // Hex is safe for both URL paths and Telegram's secret_token charset.
    return randomBytes(24).toString('hex');
  }

  private async invalidateTokenCache(): Promise<void> {
    await this.redis.delByPattern(this.redis.key('reg', '*'));
  }
}
