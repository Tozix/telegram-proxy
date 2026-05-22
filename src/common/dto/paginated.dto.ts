import { ApiProperty } from '@nestjs/swagger';

/** Метаданные постраничной навигации, общие для всех списочных ответов. */
export class PaginatedMetaDto {
  @ApiProperty({ example: 42, description: 'Всего записей, удовлетворяющих запросу' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Номер текущей страницы' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Размер страницы' })
  limit!: number;

  @ApiProperty({ example: 3, description: 'Всего страниц' })
  totalPages!: number;
}

/** Вычисляет метаданные страницы по общему количеству записей. */
export function buildMeta(total: number, page: number, limit: number): PaginatedMetaDto {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
