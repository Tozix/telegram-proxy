import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateBotDto {
  @ApiProperty({ example: 'CrossmarkSupportBot', description: 'Human-friendly name for the admin UI.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    description: 'Telegram bot token issued by @BotFather.',
  })
  @IsString()
  @Matches(/^\d{6,}:[A-Za-z0-9_-]{30,}$/, { message: 'token must be a valid Telegram bot token' })
  token!: string;

  @ApiProperty({
    example: 'https://my-backend.ru/telegram/webhook',
    description: 'Real backend URL that should receive forwarded updates.',
  })
  @IsUrl({ require_protocol: true, require_tld: false })
  targetWebhookUrl!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['message', 'callback_query'],
    description: 'Telegram allowed_updates list passed to setWebhook.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUpdates?: string[];

  @ApiPropertyOptional({ description: 'Pass drop_pending_updates=true to setWebhook on creation.' })
  @IsOptional()
  @IsBoolean()
  dropPendingUpdates?: boolean;
}
