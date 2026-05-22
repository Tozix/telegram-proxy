import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;

  @ApiProperty({ example: 'strong-password', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  password!: string;
}
