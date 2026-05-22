import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DeliveryLog } from '../../../generated/prisma/client';
import { Expose, plainToInstance } from 'class-transformer';

/** One webhook delivery attempt from Telegram → proxy → real backend. */
export class DeliveryLogResponseDto {
  @Expose()
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  botId!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '777', description: 'Идентификатор апдейта Telegram (update_id)' })
  updateId!: string | null;

  @Expose()
  @ApiProperty({ example: 'https://your-backend.example.com/telegram/webhook' })
  targetUrl!: string;

  @Expose()
  @ApiProperty({ example: 142, description: 'Размер пересланного тела в байтах' })
  requestBytes!: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 200, description: 'HTTP-статус, вернувшийся от бэкенда' })
  responseStatus!: number | null;

  @Expose()
  @ApiProperty({ example: true })
  success!: boolean;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: null })
  errorMessage!: string | null;

  @Expose()
  @ApiProperty({ example: 15 })
  durationMs!: number;

  @Expose()
  @ApiProperty({ example: 1, description: 'Номер попытки доставки (1 = первая отправка)' })
  attempt!: number;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:50:30.130Z' })
  createdAt!: Date;

  static from(log: DeliveryLog): DeliveryLogResponseDto {
    return plainToInstance(DeliveryLogResponseDto, log, { excludeExtraneousValues: true });
  }
}
