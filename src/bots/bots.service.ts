import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { TelegramService } from '../telegram/telegram.service';
import { Bot } from './bot.entity';
import { BotResponseDto } from './dto/bot-response.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { WebhookInfoDto } from './dto/webhook-info.dto';

interface CachedToken {
  exists: boolean;
  expiresAt: number;
}

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);
  private readonly publicBaseUrl: string;
  private readonly tokenCache = new Map<string, CachedToken>();
  private readonly tokenCacheTtlMs = 30_000;

  constructor(
    @InjectRepository(Bot) private readonly bots: Repository<Bot>,
    private readonly telegram: TelegramService,
    config: ConfigService,
  ) {
    this.publicBaseUrl = config.get<string>('publicBaseUrl')!;
  }

  // ----- public API (returns DTOs) -----

  async create(dto: CreateBotDto): Promise<BotResponseDto> {
    const existing = await this.bots.findOne({ where: { token: dto.token } });
    if (existing) {
      throw new ConflictException('A bot with this token is already registered');
    }

    // Validate the token and capture the bot identity.
    const me = await this.telegram.getMe(dto.token);

    const bot = this.bots.create({
      name: dto.name,
      token: dto.token,
      telegramBotId: me.id,
      username: me.username ?? null,
      webhookSecret: this.generateSecret(),
      targetWebhookUrl: dto.targetWebhookUrl,
      allowedUpdates: dto.allowedUpdates ?? null,
      isActive: true,
    });
    await this.bots.save(bot);
    this.invalidateTokenCache();

    await this.registerWebhook(bot, dto.dropPendingUpdates ?? false);
    return this.toDto(bot);
  }

  async findAll(): Promise<BotResponseDto[]> {
    const bots = await this.bots.find({ order: { createdAt: 'DESC' } });
    return bots.map((b) => this.toDto(b));
  }

  async findOne(id: string): Promise<BotResponseDto> {
    return this.toDto(await this.getEntity(id));
  }

  async update(id: string, dto: UpdateBotDto): Promise<BotResponseDto> {
    const bot = await this.getEntity(id);

    const webhookAffecting =
      (dto.token !== undefined && dto.token !== bot.token) ||
      (dto.targetWebhookUrl !== undefined && dto.targetWebhookUrl !== bot.targetWebhookUrl) ||
      dto.allowedUpdates !== undefined;

    if (dto.token !== undefined && dto.token !== bot.token) {
      const clash = await this.bots.findOne({ where: { token: dto.token } });
      if (clash && clash.id !== bot.id) {
        throw new ConflictException('A bot with this token is already registered');
      }
      const me = await this.telegram.getMe(dto.token);
      bot.token = dto.token;
      bot.telegramBotId = me.id;
      bot.username = me.username ?? null;
    }

    if (dto.name !== undefined) bot.name = dto.name;
    if (dto.targetWebhookUrl !== undefined) bot.targetWebhookUrl = dto.targetWebhookUrl;
    if (dto.allowedUpdates !== undefined) bot.allowedUpdates = dto.allowedUpdates;
    if (dto.isActive !== undefined) bot.isActive = dto.isActive;

    await this.bots.save(bot);
    this.invalidateTokenCache();

    if (dto.isActive === false) {
      await this.safeDeleteWebhook(bot);
    } else if (webhookAffecting || dto.isActive === true) {
      await this.registerWebhook(bot, false);
    }

    return this.toDto(bot);
  }

  async remove(id: string, dropPendingUpdates = false): Promise<void> {
    const bot = await this.getEntity(id);
    await this.safeDeleteWebhook(bot, dropPendingUpdates);
    await this.bots.remove(bot);
    this.invalidateTokenCache();
  }

  async refreshWebhook(id: string, dropPendingUpdates = false): Promise<BotResponseDto> {
    const bot = await this.getEntity(id);
    await this.registerWebhook(bot, dropPendingUpdates);
    return this.toDto(bot);
  }

  async getWebhookInfo(id: string): Promise<WebhookInfoDto> {
    const bot = await this.getEntity(id);
    return WebhookInfoDto.from(await this.telegram.getWebhookInfo(bot.token));
  }

  // ----- internal API (returns entities) -----

  async getEntity(id: string): Promise<Bot> {
    const bot = await this.bots.findOne({ where: { id } });
    if (!bot) throw new NotFoundException('Bot not found');
    return bot;
  }

  findByWebhookSecret(secret: string): Promise<Bot | null> {
    return this.bots.findOne({ where: { webhookSecret: secret } });
  }

  async isRegisteredToken(token: string): Promise<boolean> {
    const cached = this.tokenCache.get(token);
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.exists;

    const count = await this.bots.count({ where: { token } });
    const exists = count > 0;
    this.tokenCache.set(token, { exists, expiresAt: now + this.tokenCacheTtlMs });
    return exists;
  }

  // ----- helpers -----

  private toDto(bot: Bot): BotResponseDto {
    return BotResponseDto.from(bot, this.publicBaseUrl);
  }

  /** Registers our public webhook URL with Telegram and records the outcome. */
  private async registerWebhook(bot: Bot, dropPendingUpdates: boolean): Promise<void> {
    const url = `${this.publicBaseUrl}/webhook/${bot.webhookSecret}`;
    try {
      await this.telegram.setWebhook(bot.token, {
        url,
        secretToken: bot.webhookSecret,
        allowedUpdates: bot.allowedUpdates,
        dropPendingUpdates,
      });
      bot.lastWebhookSetAt = new Date();
      bot.webhookError = null;
      this.logger.log(`Webhook set for bot ${bot.id} (${bot.username ?? bot.name}) -> ${url}`);
    } catch (err) {
      bot.webhookError = (err as Error).message;
      this.logger.warn(`Failed to set webhook for bot ${bot.id}: ${bot.webhookError}`);
    }
    await this.bots.save(bot);
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

  private invalidateTokenCache(): void {
    this.tokenCache.clear();
  }
}
