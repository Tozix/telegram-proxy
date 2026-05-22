import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { StatsResponseDto } from './dto/stats-response.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Отсутствует или неверный bearer-токен' })
@ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Требуются права администратора' })
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Сводная статистика',
    description: 'Счётчики по пользователям, ботам и доставкам + ряд доставок по дням и топ ботов. Только для админов.',
  })
  @ApiOkResponse({ type: StatsResponseDto })
  overview(): Promise<StatsResponseDto> {
    return this.stats.overview();
  }
}
