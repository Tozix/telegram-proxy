import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import type { ApiToken } from '../../../generated/prisma/client';

/**
 * Ответ на создание токена. Содержит САМО значение токена — оно отдаётся
 * единственный раз и больше нигде не хранится, поэтому его нужно сохранить сразу.
 */
export class CreatedApiTokenDto {
  @Expose()
  @ApiProperty({ format: 'uuid', example: '6beeefbd-5ae2-4f29-a3ad-5d6ed44c458a' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'CI deploy' })
  name!: string;

  @Expose()
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiI...',
    description: 'Bearer-токен. Показывается один раз — сохраните его сейчас.',
  })
  token!: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '3025-06-04T07:40:00.000Z' })
  expiresAt!: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-06-04T07:40:00.000Z' })
  createdAt!: Date;

  static from(row: ApiToken, token: string): CreatedApiTokenDto {
    return plainToInstance(CreatedApiTokenDto, { ...row, token }, { excludeExtraneousValues: true });
  }
}
