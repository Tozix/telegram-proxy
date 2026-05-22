import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { Bot } from '../bot.entity';

/**
 * Public representation of a Bot. Built with class-transformer using the
 * `excludeExtraneousValues` strategy, so only `@Expose()`-decorated fields are
 * ever serialized — the raw token can never leak through this DTO.
 */
export class BotResponseDto {
  @Expose()
  @ApiProperty({ format: 'uuid', example: '72e27ba0-64e0-4a20-875e-9cde146b42e8' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Crossmark Support Bot' })
  name!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'crossmark_support_bot', description: '@-username from getMe' })
  username!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 7123456789, description: 'Numeric Telegram id from getMe' })
  telegramBotId!: number | null;

  @Expose()
  @ApiProperty({ example: '7123456789:******cdef', description: 'Masked token preview (full token is never returned)' })
  tokenPreview!: string;

  @Expose()
  @ApiProperty({
    example: 'https://telegram.crossmark.ru/webhook/2f1c…',
    description: 'URL registered in Telegram for this bot',
  })
  webhookUrl!: string;

  @Expose()
  @ApiProperty({ example: 'https://my-backend.ru/telegram/webhook', description: 'Real backend updates are forwarded to' })
  targetWebhookUrl!: string;

  @Expose()
  @ApiPropertyOptional({ type: [String], nullable: true, example: ['message', 'callback_query'] })
  allowedUpdates!: string[] | null;

  @Expose()
  @ApiProperty({ example: true })
  isActive!: boolean;

  @Expose()
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'date-time',
    example: '2026-05-22T07:50:30.130Z',
    description: 'When the webhook was last successfully set in Telegram',
  })
  lastWebhookSetAt!: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: null, description: 'Last setWebhook error, if any' })
  webhookError!: string | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:40:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:50:30.130Z' })
  updatedAt!: Date;

  static from(bot: Bot, publicBaseUrl: string): BotResponseDto {
    const source = {
      id: bot.id,
      name: bot.name,
      username: bot.username,
      telegramBotId: bot.telegramBotId,
      tokenPreview: maskToken(bot.token),
      webhookUrl: `${publicBaseUrl}/webhook/${bot.webhookSecret}`,
      targetWebhookUrl: bot.targetWebhookUrl,
      allowedUpdates: bot.allowedUpdates,
      isActive: bot.isActive,
      lastWebhookSetAt: bot.lastWebhookSetAt,
      webhookError: bot.webhookError,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
    };
    return plainToInstance(BotResponseDto, source, { excludeExtraneousValues: true });
  }
}

function maskToken(token: string): string {
  const [id, secret] = token.split(':');
  if (!secret) return '***';
  return `${id}:${'*'.repeat(6)}${secret.slice(-4)}`;
}
