import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  tokenType!: string;

  @ApiProperty({ example: 604800, description: 'Сколько секунд до истечения токена (приблизительно).' })
  expiresIn!: number;
}
