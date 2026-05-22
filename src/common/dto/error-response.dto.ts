import { ApiProperty } from '@nestjs/swagger';

/** Shape of NestJS error responses — used only for Swagger documentation. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['token должен быть корректным токеном Telegram-бота'],
    description: 'Текст ошибки или массив ошибок валидации',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
