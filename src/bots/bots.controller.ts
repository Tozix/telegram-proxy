import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBadGatewayResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BotsService } from './bots.service';
import { BotResponseDto } from './dto/bot-response.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { PaginatedBotsDto } from './dto/paginated-bots.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { WebhookInfoDto } from './dto/webhook-info.dto';

@ApiTags('bots')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Отсутствует или неверный bearer-токен' })
@UseGuards(JwtAuthGuard)
@Controller('api/bots')
export class BotsController {
  constructor(private readonly bots: BotsService) {}

  @Post()
  @ApiOperation({
    summary: 'Зарегистрировать бота',
    description:
      'Проверяет токен через `getMe`, генерирует секрет вебхука и вызывает Telegram `setWebhook`, ' +
      'указывая `{PUBLIC_BASE_URL}/webhook/<secret>`. Бот создаётся даже если setWebhook не удался — ' +
      'смотрите поле `webhookError` в ответе.',
  })
  @ApiCreatedResponse({ type: BotResponseDto, description: 'Бот зарегистрирован' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Бот с таким токеном уже существует' })
  @ApiBadGatewayResponse({ type: ErrorResponseDto, description: 'Telegram отклонил токен (getMe не удался)' })
  create(@Body() dto: CreateBotDto): Promise<BotResponseDto> {
    return this.bots.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список ботов', description: 'Постраничный список ботов, новые сверху.' })
  @ApiOkResponse({ type: PaginatedBotsDto })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedBotsDto> {
    return this.bots.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить бота' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BotResponseDto> {
    return this.bots.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Изменить бота',
    description:
      'Смена токена, целевого URL или allowed_updates переустанавливает вебхук в Telegram. ' +
      '`isActive: false` удаляет вебхук; возврат в `true` восстанавливает его.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Токен уже используется другим ботом' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBotDto): Promise<BotResponseDto> {
    return this.bots.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить бота', description: 'Удаляет бота и по возможности вызывает Telegram `deleteWebhook`.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'dropPendingUpdates', required: false, type: Boolean })
  @ApiNoContentResponse({ description: 'Бот удалён' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dropPendingUpdates', new ParseBoolPipe({ optional: true })) dropPendingUpdates?: boolean,
  ): Promise<void> {
    await this.bots.remove(id, dropPendingUpdates ?? false);
  }

  @Post(':id/refresh-webhook')
  @ApiOperation({ summary: 'Переустановить вебхук', description: 'Повторно вызывает Telegram `setWebhook` для бота.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'dropPendingUpdates', required: false, type: Boolean })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  refreshWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dropPendingUpdates', new ParseBoolPipe({ optional: true })) dropPendingUpdates?: boolean,
  ): Promise<BotResponseDto> {
    return this.bots.refreshWebhook(id, dropPendingUpdates ?? false);
  }

  @Get(':id/webhook-info')
  @ApiOperation({ summary: 'Информация о вебхуке (живая)', description: 'Запрашивает `getWebhookInfo` напрямую у Telegram.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WebhookInfoDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Бот не найден' })
  @ApiBadGatewayResponse({ type: ErrorResponseDto, description: 'Telegram API недоступен' })
  webhookInfo(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookInfoDto> {
    return this.bots.getWebhookInfo(id);
  }
}
