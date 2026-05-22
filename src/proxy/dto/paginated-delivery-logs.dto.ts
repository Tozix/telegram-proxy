import { ApiProperty } from '@nestjs/swagger';
import { PaginatedMetaDto } from '../../common/dto/paginated.dto';
import { DeliveryLogResponseDto } from './delivery-log-response.dto';

/** Страница журнала доставок вебхуков. */
export class PaginatedDeliveryLogsDto extends PaginatedMetaDto {
  @ApiProperty({ type: [DeliveryLogResponseDto], description: 'Записи журнала на текущей странице' })
  items!: DeliveryLogResponseDto[];
}
