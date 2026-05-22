import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'admin@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @ApiPropertyOptional({ example: 'new-strong-password', minLength: 8, description: 'Новый пароль' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  password?: string;
}
