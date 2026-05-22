import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotsService } from '../bots/bots.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ForwardResult {
  status: number;
  contentType: string;
  body: string | Buffer;
}

interface AttemptLog {
  botId: string;
  updateId: string | null;
  targetUrl: string;
  requestBytes: number;
  responseStatus: number | null;
  success: boolean;
  errorMessage: string | null;
  durationMs: number;
  attempt: number;
}

const JSON_CT = 'application/json';
const ACK: ForwardResult = { status: 200, contentType: JSON_CT, body: '' };

/**
 * Receives an update from Telegram on /webhook/:secret and forwards it verbatim
 * to the bot's real backend, passing the backend's response straight back to
 * Telegram (so "answer via webhook response" keeps working).
 *
 * If the backend does NOT return a 2xx status (or the request errors/times out),
 * the delivery is retried up to `proxy.webhookRetryAttempts` times with an
 * exponential backoff. Every attempt is written to `delivery_log` with its
 * attempt number. On the first 2xx the response is passed through; if all
 * attempts fail we acknowledge Telegram with 200 (5xx) so it doesn't enter a
 * retry storm, while a 4xx is preserved.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly forwardTimeoutMs: number;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly bots: BotsService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.forwardTimeoutMs = this.config.get<number>('proxy.webhookForwardTimeoutMs')!;
    this.retryAttempts = this.config.get<number>('proxy.webhookRetryAttempts')!;
    this.retryDelayMs = this.config.get<number>('proxy.webhookRetryDelayMs')!;
  }

  async handle(secret: string, update: unknown, secretTokenHeader?: string): Promise<ForwardResult> {
    const bot = await this.bots.findByWebhookSecret(secret);
    if (!bot) {
      return { status: 404, contentType: JSON_CT, body: '{"ok":false,"description":"Неизвестный вебхук"}' };
    }

    // Defence in depth: Telegram echoes our secret_token in this header.
    if (secretTokenHeader !== bot.webhookSecret) {
      return { status: 403, contentType: JSON_CT, body: '{"ok":false,"description":"Доступ запрещён"}' };
    }

    if (!bot.isActive) {
      return ACK; // Acknowledge but drop — bot disabled in admin.
    }

    const payload = JSON.stringify(update ?? {});
    const updateId = this.extractUpdateId(update);
    const maxAttempts = this.retryAttempts + 1; // initial send + retries

    let lastResponse: { status: number; contentType: string; body: Buffer } | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
        await this.record({
          botId: bot.id,
          updateId,
          targetUrl: bot.targetWebhookUrl,
          requestBytes: payload.length,
          responseStatus: res.status,
          success: res.ok,
          errorMessage: res.ok ? null : `HTTP ${res.status}`,
          durationMs: Date.now() - started,
          attempt,
        });

        if (res.ok) {
          // 2xx — pass the backend response straight through to Telegram.
          return {
            status: res.status,
            contentType: res.headers.get('content-type') ?? JSON_CT,
            body: responseBody,
          };
        }

        // Non-2xx — remember it and retry (if attempts remain).
        lastResponse = {
          status: res.status,
          contentType: res.headers.get('content-type') ?? JSON_CT,
          body: responseBody,
        };
        this.logger.warn(
          `Webhook to ${bot.targetWebhookUrl} returned ${res.status} (attempt ${attempt}/${maxAttempts})`,
        );
      } catch (err) {
        const message = (err as Error).message;
        await this.record({
          botId: bot.id,
          updateId,
          targetUrl: bot.targetWebhookUrl,
          requestBytes: payload.length,
          responseStatus: null,
          success: false,
          errorMessage: message,
          durationMs: Date.now() - started,
          attempt,
        });
        this.logger.warn(
          `Webhook to ${bot.targetWebhookUrl} failed: ${message} (attempt ${attempt}/${maxAttempts})`,
        );
      }

      if (attempt < maxAttempts) {
        await this.delay(this.retryDelayMs * 2 ** (attempt - 1));
      }
    }

    // All attempts exhausted.
    if (lastResponse) {
      // Never bubble a 5xx to Telegram (retry storm); a 4xx is preserved.
      const status = lastResponse.status >= 500 ? 200 : lastResponse.status;
      return { status, contentType: lastResponse.contentType, body: lastResponse.body };
    }
    return ACK; // Only network errors/timeouts — acknowledge so Telegram backs off.
  }

  private async record(log: AttemptLog): Promise<void> {
    try {
      await this.prisma.deliveryLog.create({ data: log });
    } catch (err) {
      this.logger.error(`Failed to write delivery log: ${(err as Error).message}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUpdateId(update: unknown): string | null {
    if (update && typeof update === 'object' && 'update_id' in update) {
      const id = (update as Record<string, unknown>).update_id;
      return id == null ? null : String(id);
    }
    return null;
  }
}
