import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { WebhookInfo } from '../../telegram/telegram.service';

/**
 * Mirrors Telegram's getWebhookInfo result (snake_case kept on purpose so it is
 * recognizable against the official Bot API docs).
 */
export class WebhookInfoDto {
  @Expose()
  @ApiProperty({ example: 'https://telegram.crossmark.ru/webhook/2f1c…' })
  url!: string;

  @Expose()
  @ApiProperty({ example: false })
  has_custom_certificate!: boolean;

  @Expose()
  @ApiProperty({ example: 0, description: 'Количество апдейтов, ожидающих доставки' })
  pending_update_count!: number;

  @Expose()
  @ApiPropertyOptional({ example: '149.154.167.197' })
  ip_address?: string;

  @Expose()
  @ApiPropertyOptional({ example: 1716367830, description: 'Unix-время последней ошибки доставки' })
  last_error_date?: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Connection timed out' })
  last_error_message?: string;

  @Expose()
  @ApiPropertyOptional({ example: 40 })
  max_connections?: number;

  @Expose()
  @ApiPropertyOptional({ type: [String], example: ['message', 'callback_query'] })
  allowed_updates?: string[];

  static from(info: WebhookInfo): WebhookInfoDto {
    return plainToInstance(WebhookInfoDto, info, { excludeExtraneousValues: true });
  }
}
