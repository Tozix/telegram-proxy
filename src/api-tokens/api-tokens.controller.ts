import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt.strategy';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ApiTokensService } from './api-tokens.service';
import { ApiTokenResponseDto } from './dto/api-token-response.dto';
import { CreateApiTokenDto } from './dto/create-api-token.dto';
import { CreatedApiTokenDto } from './dto/created-api-token.dto';

const actor = (req: Request): AuthUser => req.user as AuthUser;

@ApiTags('api-tokens')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Отсутствует или неверный bearer-токен' })
@UseGuards(JwtAuthGuard)
@Controller('api/tokens')
export class ApiTokensController {
  constructor(private readonly tokens: ApiTokensService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать статический токен',
    description:
      'Выпускает долгоживущий (≈999 лет) bearer-токен с правами текущего пользователя — ' +
      'для доступа ко всем эндпоинтам `/api/*` без логина и пароля. Значение токена ' +
      'возвращается ОДИН раз; сохраните его сразу.',
  })
  @ApiCreatedResponse({ type: CreatedApiTokenDto, description: 'Токен создан (значение видно один раз)' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  create(@Body() dto: CreateApiTokenDto, @Req() req: Request): Promise<CreatedApiTokenDto> {
    return this.tokens.create(actor(req), dto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Список своих токенов', description: 'Метаданные токенов текущего пользователя (без значений).' })
  @ApiOkResponse({ type: [ApiTokenResponseDto] })
  list(@Req() req: Request): Promise<ApiTokenResponseDto[]> {
    return this.tokens.list(actor(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отозвать токен', description: 'Удаляет токен — он немедленно перестаёт работать.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Токен отозван' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Токен не найден' })
  async revoke(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    await this.tokens.revoke(actor(req), id);
  }
}
