import { Body, Controller, Headers, Param, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

/**
 * Public endpoint that Telegram calls. Not part of the admin API, so it is
 * hidden from Swagger and is NOT behind the JWT guard.
 */
@ApiExcludeController()
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhook: WebhookService) {}

  @Post(':secret')
  async handle(
    @Param('secret') secret: string,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string | undefined,
    @Body() update: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Express may hand us a parsed object or, for empty bodies, {}.
    const body = update ?? req.body;
    const result = await this.webhook.handle(secret, body, secretToken);
    res.status(result.status).type(result.contentType).send(result.body);
  }
}
