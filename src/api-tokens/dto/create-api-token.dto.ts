import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateApiTokenDto {
  @ApiProperty({
    example: 'CI deploy',
    maxLength: 100,
    description: 'Произвольная метка, чтобы отличать токены друг от друга.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
