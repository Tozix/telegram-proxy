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
import { BotsService } from './bots.service';
import { BotResponseDto } from './dto/bot-response.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { WebhookInfoDto } from './dto/webhook-info.dto';

@ApiTags('bots')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Missing or invalid bearer token' })
@UseGuards(JwtAuthGuard)
@Controller('api/bots')
export class BotsController {
  constructor(private readonly bots: BotsService) {}

  @Post()
  @ApiOperation({
    summary: 'Register a bot',
    description:
      'Validates the token via `getMe`, generates a webhook secret, then calls Telegram `setWebhook` ' +
      'pointing at `{PUBLIC_BASE_URL}/webhook/<secret>`. The bot is created even if setWebhook fails; ' +
      'inspect `webhookError` in the response.',
  })
  @ApiCreatedResponse({ type: BotResponseDto, description: 'Bot registered' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation failed' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'A bot with this token already exists' })
  @ApiBadGatewayResponse({ type: ErrorResponseDto, description: 'Telegram rejected the token (getMe failed)' })
  create(@Body() dto: CreateBotDto): Promise<BotResponseDto> {
    return this.bots.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bots', description: 'Returns all registered bots, newest first.' })
  @ApiOkResponse({ type: [BotResponseDto] })
  findAll(): Promise<BotResponseDto[]> {
    return this.bots.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bot' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Bot not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BotResponseDto> {
    return this.bots.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a bot',
    description: 'Changing the token, target URL or allowed updates re-registers the webhook in Telegram. ' +
      'Setting `isActive: false` removes the webhook; setting it back to `true` restores it.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation failed' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Bot not found' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Token already used by another bot' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBotDto): Promise<BotResponseDto> {
    return this.bots.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bot', description: 'Removes the bot and best-effort calls Telegram `deleteWebhook`.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'dropPendingUpdates', required: false, type: Boolean })
  @ApiNoContentResponse({ description: 'Bot deleted' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Bot not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dropPendingUpdates', new ParseBoolPipe({ optional: true })) dropPendingUpdates?: boolean,
  ): Promise<void> {
    await this.bots.remove(id, dropPendingUpdates ?? false);
  }

  @Post(':id/refresh-webhook')
  @ApiOperation({ summary: 'Re-register webhook', description: 'Calls Telegram `setWebhook` again for this bot.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'dropPendingUpdates', required: false, type: Boolean })
  @ApiOkResponse({ type: BotResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Bot not found' })
  refreshWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dropPendingUpdates', new ParseBoolPipe({ optional: true })) dropPendingUpdates?: boolean,
  ): Promise<BotResponseDto> {
    return this.bots.refreshWebhook(id, dropPendingUpdates ?? false);
  }

  @Get(':id/webhook-info')
  @ApiOperation({ summary: 'Live webhook info', description: 'Fetches `getWebhookInfo` directly from Telegram.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WebhookInfoDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Bot not found' })
  @ApiBadGatewayResponse({ type: ErrorResponseDto, description: 'Telegram API unreachable' })
  webhookInfo(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookInfoDto> {
    return this.bots.getWebhookInfo(id);
  }
}
