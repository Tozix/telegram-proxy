import { ApiProperty } from '@nestjs/swagger';

/** Метаданные limit/offset-навигации, общие для всех списочных ответов. */
export class PaginatedMetaDto {
  @ApiProperty({ example: 42, description: 'Всего записей, удовлетворяющих запросу' })
  total!: number;

  @ApiProperty({ example: 20, description: 'Применённый limit' })
  limit!: number;

  @ApiProperty({ example: 0, description: 'Применённый offset' })
  offset!: number;
}

/** Собирает метаданные ответа списочного метода. */
export function buildMeta(total: number, limit: number, offset: number): PaginatedMetaDto {
  return { total, limit, offset };
}
