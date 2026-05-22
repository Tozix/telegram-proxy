import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotsService } from '../bots/bots.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ForwardResult {
  status: number;
  contentType: string;
  body: string | Buffer;
}

const JSON_CT = 'application/json';
const ACK: ForwardResult = { status: 200, contentType: JSON_CT, body: '' };

/**
 * Receives an update from Telegram on /webhook/:secret and forwards it verbatim
 * to the bot's real backend, passing the backend's response straight back to
 * Telegram (so "answer via webhook response" keeps working).
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly forwardTimeoutMs: number;

  constructor(
    private readonly bots: BotsService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.forwardTimeoutMs = this.config.get<number>('proxy.webhookForwardTimeoutMs')!;
  }

  async handle(secret: string, update: unknown, secretTokenHeader?: string): Promise<ForwardResult> {
    const bot = await this.bots.findByWebhookSecret(secret);
    if (!bot) {
      return { status: 404, contentType: JSON_CT, body: '{"ok":false,"description":"Unknown webhook"}' };
    }

    // Defence in depth: Telegram echoes our secret_token in this header.
    if (secretTokenHeader !== bot.webhookSecret) {
      return { status: 403, contentType: JSON_CT, body: '{"ok":false,"description":"Forbidden"}' };
    }

    if (!bot.isActive) {
      return ACK; // Acknowledge but drop — bot disabled in admin.
    }

    const payload = JSON.stringify(update ?? {});
    const updateId = this.extractUpdateId(update);
    const started = Date.now();

    try {
      const res = await fetch(bot.targetWebhookUrl, {
        method: 'POST',
        headers: {
          'content-type': JSON_CT,
          // Forwarded so the backend can validate exactly as if Telegram called it.
          'x-telegram-bot-api-secret-token': bot.webhookSecret,
        },
        body: payload,
        signal: AbortSignal.timeout(this.forwardTimeoutMs),
      });

      const responseBody = Buffer.from(await res.arrayBuffer());
      await this.record(bot.id, updateId, bot.targetWebhookUrl, payload.length, res.status, res.ok, null, Date.now() - started);

      // Pass the backend response through, but never bubble a 5xx to Telegram
      // (that would trigger Telegram's retry storm). 4xx is preserved.
      const status = res.status >= 500 ? 200 : res.status;
      return {
        status,
        contentType: res.headers.get('content-type') ?? JSON_CT,
        body: responseBody,
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`Forwarding to ${bot.targetWebhookUrl} failed: ${message}`);
      await this.record(bot.id, updateId, bot.targetWebhookUrl, payload.length, null, false, message, Date.now() - started);
      return ACK; // Acknowledge to Telegram so it doesn't retry indefinitely.
    }
  }

  private async record(
    botId: string,
    updateId: string | null,
    targetUrl: string,
    requestBytes: number,
    responseStatus: number | null,
    success: boolean,
    errorMessage: string | null,
    durationMs: number,
  ): Promise<void> {
    try {
      await this.prisma.deliveryLog.create({
        data: {
          botId,
          updateId,
          targetUrl,
          requestBytes,
          responseStatus,
          success,
          errorMessage,
          durationMs,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write delivery log: ${(err as Error).message}`);
    }
  }

  private extractUpdateId(update: unknown): string | null {
    if (update && typeof update === 'object' && 'update_id' in update) {
      const id = (update as Record<string, unknown>).update_id;
      return id == null ? null : String(id);
    }
    return null;
  }
}
