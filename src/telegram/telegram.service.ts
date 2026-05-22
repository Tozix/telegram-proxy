import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export interface SetWebhookParams {
  url: string;
  secretToken: string;
  allowedUpdates?: string[] | null;
  dropPendingUpdates?: boolean;
  maxConnections?: number;
}

/**
 * Thin typed client for the handful of Telegram Bot API methods this service
 * calls itself (webhook management + identity checks). All other Bot API calls
 * are handled transparently by the proxy and never touch this class.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiBase: string;

  constructor(config: ConfigService) {
    this.apiBase = config.get<string>('telegram.apiBase')!;
  }

  async call<T>(token: string, method: string, payload?: Record<string, unknown>): Promise<T> {
    const url = `${this.apiBase}/bot${token}/${method}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      this.logger.error(`Telegram ${method} request failed: ${(err as Error).message}`);
      throw new BadGatewayException(`Не удалось обратиться к Telegram API: ${(err as Error).message}`);
    }

    const data = (await res.json().catch(() => ({}))) as TelegramResponse<T>;
    if (!data.ok) {
      throw new BadGatewayException(
        `Запрос Telegram ${method} не удался (${data.error_code ?? res.status}): ${data.description ?? 'неизвестная ошибка'}`,
      );
    }
    return data.result as T;
  }

  getMe(token: string): Promise<TelegramUser> {
    return this.call<TelegramUser>(token, 'getMe');
  }

  setWebhook(token: string, params: SetWebhookParams): Promise<boolean> {
    return this.call<boolean>(token, 'setWebhook', {
      url: params.url,
      secret_token: params.secretToken,
      allowed_updates: params.allowedUpdates ?? undefined,
      drop_pending_updates: params.dropPendingUpdates ?? undefined,
      max_connections: params.maxConnections ?? undefined,
    });
  }

  deleteWebhook(token: string, dropPendingUpdates = false): Promise<boolean> {
    return this.call<boolean>(token, 'deleteWebhook', { drop_pending_updates: dropPendingUpdates });
  }

  getWebhookInfo(token: string): Promise<WebhookInfo> {
    return this.call<WebhookInfo>(token, 'getWebhookInfo');
  }
}
