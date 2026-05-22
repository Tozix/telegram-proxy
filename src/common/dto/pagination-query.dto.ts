import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Общие query-параметры limit/offset для списочных методов. */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Сколько записей вернуть',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть не меньше 1' })
  @Max(100, { message: 'limit должен быть не больше 100' })
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Смещение от начала (сколько записей пропустить)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset должен быть целым числом' })
  @Min(0, { message: 'offset должен быть не меньше 0' })
  offset: number = 0;
}
