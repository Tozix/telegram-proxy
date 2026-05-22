import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedDeliveryLogsDto } from './dto/paginated-delivery-logs.dto';
import { DeliveryLogsService } from './delivery-logs.service';

@ApiTags('bots')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Отсутствует или неверный bearer-токен' })
@UseGuards(JwtAuthGuard)
@Controller('api/bots')
export class DeliveryLogsController {
  constructor(private readonly logs: DeliveryLogsService) {}

  @Get(':id/logs')
  @ApiOperation({
    summary: 'Журнал доставок вебхуков',
    description: 'Постраничный список попыток доставки (Telegram → прокси → бэкенд) для бота, новые сверху.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedDeliveryLogsDto })
  list(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedDeliveryLogsDto> {
    return this.logs.findByBot(id, query.page, query.limit);
  }
}
