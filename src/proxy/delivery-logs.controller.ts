import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BotsService } from '../bots/bots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt.strategy';
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
  constructor(
    private readonly logs: DeliveryLogsService,
    private readonly bots: BotsService,
  ) {}

  @Get(':id/logs')
  @ApiOperation({
    summary: 'Журнал доставок вебхуков',
    description: 'Список попыток доставки (Telegram → прокси → бэкенд) для бота (limit/offset), новые сверху.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedDeliveryLogsDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  async list(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
    @Req() req: Request,
  ): Promise<PaginatedDeliveryLogsDto> {
    // Authorize: ownership (or admin); throws 404 otherwise.
    await this.bots.getEntity(id, req.user as AuthUser);
    return this.logs.findByBot(id, query.limit, query.offset);
  }
}
