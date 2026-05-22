import { ApiProperty } from '@nestjs/swagger';

/** Simple `{ message }` response for actions without a resource body. */
export class MessageResponseDto {
  @ApiProperty({ example: 'Готово' })
  message!: string;
}
