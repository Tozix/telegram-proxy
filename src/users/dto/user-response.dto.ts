import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import type { User } from '../../../generated/prisma/client';

/** Public representation of an admin user — never exposes the password hash. */
export class UserResponseDto {
  @Expose()
  @ApiProperty({ format: 'uuid', example: '6beeefbd-5ae2-4f29-a3ad-5d6ed44c458a' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'admin', enum: ['admin', 'user'] })
  role!: string;

  @Expose()
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-05-22T07:45:00.000Z',
    description: 'Когда подтверждён email (null = не подтверждён)',
  })
  emailVerifiedAt!: Date | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:40:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:50:30.130Z' })
  updatedAt!: Date;

  static from(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
