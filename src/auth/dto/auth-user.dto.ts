import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { AuthUser } from '../jwt.strategy';

export class AuthUserDto {
  @Expose()
  @ApiProperty({ format: 'uuid', example: '6beeefbd-5ae2-4f29-a3ad-5d6ed44c458a' })
  userId!: string;

  @Expose()
  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'admin' })
  role!: string;

  static from(user: AuthUser): AuthUserDto {
    return plainToInstance(AuthUserDto, user, { excludeExtraneousValues: true });
  }
}
