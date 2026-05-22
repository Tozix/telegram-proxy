import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Общие query-параметры постраничной навигации для списочных методов. */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Номер страницы (начиная с 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page должен быть целым числом' })
  @Min(1, { message: 'page должен быть не меньше 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Размер страницы (количество записей)',
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
}
