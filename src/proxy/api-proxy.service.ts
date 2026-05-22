import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { BotsService } from '../bots/bots.service';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'accept-encoding',
]);

/**
 * Transparent reverse proxy for the Telegram Bot API. Mounted on `/bot*` and
 * `/file*` so that pointing a bot backend at https://telegram.crossmark.ru
 * instead of https://api.telegram.org "just works" for every method, including
 * multipart file uploads and file downloads.
 */
@Injectable()
export class ApiProxyService {
  private readonly logger = new Logger(ApiProxyService.name);
  private readonly apiBase: string;
  private readonly allowUnregistered: boolean;
  private readonly timeoutMs: number;
  private readonly maxUploadBytes: number;

  constructor(private readonly bots: BotsService, config: ConfigService) {
    this.apiBase = config.get<string>('telegram.apiBase')!;
    this.allowUnregistered = config.get<boolean>('proxy.allowUnregistered')!;
    this.timeoutMs = config.get<number>('proxy.timeoutMs')!;
    this.maxUploadBytes = config.get<number>('proxy.maxUploadMb')! * 1024 * 1024;
  }

  /** Express-style handler. Bridged into the app via `app.use()` in main.ts. */
  handle = async (req: Request, res: Response): Promise<void> => {
    const path = req.originalUrl;
    const token = this.extractToken(path);

    if (!token) {
      this.sendError(res, 404, 'Not Found: expected /bot<token>/<method>');
      return;
    }

    if (!this.allowUnregistered && !(await this.bots.isRegisteredToken(token))) {
      this.sendError(res, 403, 'Bot token is not registered with this proxy');
      return;
    }

    let body: Buffer | undefined;
    if (this.methodHasBody(req.method)) {
      try {
        body = await this.readRawBody(req);
      } catch (err) {
        this.sendError(res, 413, (err as Error).message);
        return;
      }
    }

    const upstream = `${this.apiBase}${path}`;
    let tgRes: globalThis.Response;
    try {
      tgRes = await fetch(upstream, {
        method: req.method,
        headers: this.buildForwardHeaders(req),
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      this.logger.warn(`Proxy to ${upstream} failed: ${(err as Error).message}`);
      this.sendError(res, 502, `Bad Gateway: ${(err as Error).message}`);
      return;
    }

    res.status(tgRes.status);
    tgRes.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });
    res.send(Buffer.from(await tgRes.arrayBuffer()));
  };

  private extractToken(path: string): string | null {
    const match = /^\/(?:file\/)?bot([^/]+)\//.exec(path);
    return match ? match[1] : null;
  }

  private methodHasBody(method: string): boolean {
    return !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase());
  }

  private buildForwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (HOP_BY_HOP.has(key.toLowerCase())) continue;
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }
    return headers;
  }

  private readRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > this.maxUploadBytes) {
          req.destroy();
          reject(new Error(`Payload too large (> ${this.maxUploadBytes} bytes)`));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  private sendError(res: Response, status: number, description: string): void {
    res.status(status).type('application/json').send(
      JSON.stringify({ ok: false, error_code: status, description }),
    );
  }
}
