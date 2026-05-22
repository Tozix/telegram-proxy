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
  @ApiProperty({ example: 'MySupportBot', description: 'Понятное имя для отображения в админке.' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    description: 'Токен бота, выданный @BotFather.',
  })
  @IsString()
  @Matches(/^\d{6,}:[A-Za-z0-9_-]{30,}$/, { message: 'token должен быть корректным токеном Telegram-бота' })
  token!: string;

  @ApiProperty({
    example: 'https://your-backend.example.com/telegram/webhook',
    description: 'URL реального бэкенда, на который пересылаются апдейты.',
  })
  @IsUrl({ require_protocol: true, require_tld: false })
  targetWebhookUrl!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['message', 'callback_query'],
    description: 'Список allowed_updates, передаваемый в Telegram setWebhook.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUpdates?: string[];

  @ApiPropertyOptional({ description: 'Передать drop_pending_updates=true в setWebhook при создании.' })
  @IsOptional()
  @IsBoolean()
  dropPendingUpdates?: boolean;
}
