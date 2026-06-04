import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import type { ApiToken } from '../../../generated/prisma/client';

/** Метаданные статического токена — само значение токена здесь не раскрывается. */
export class ApiTokenResponseDto {
  @Expose()
  @ApiProperty({ format: 'uuid', example: '6beeefbd-5ae2-4f29-a3ad-5d6ed44c458a' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'CI deploy' })
  name!: string;

  @Expose()
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-06-04T07:50:30.130Z',
    description: 'Когда токеном в последний раз пользовались (null = ни разу).',
  })
  lastUsedAt!: Date | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '3025-06-04T07:40:00.000Z' })
  expiresAt!: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-06-04T07:40:00.000Z' })
  createdAt!: Date;

  static from(token: ApiToken): ApiTokenResponseDto {
    return plainToInstance(ApiTokenResponseDto, token, { excludeExtraneousValues: true });
  }
}
