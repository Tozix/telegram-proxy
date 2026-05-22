import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt.strategy';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Отсутствует или неверный bearer-токен' })
@ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Требуются права администратора' })
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Список администраторов', description: 'Список администраторов (limit/offset).' })
  @ApiOkResponse({ type: PaginatedUsersDto })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedUsersDto> {
    return this.users.findAll(query.limit, query.offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить администратора' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Пользователь не найден' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.users.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить администратора', description: 'Создаёт нового администратора с email и паролем.' })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Администратор создан' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email уже занят' })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.users.createAdmin(dto.email, dto.password);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить администратора', description: 'Смена пароля и/или email администратора.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Пользователь не найден' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email уже занят' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.users.updateAdmin(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить администратора',
    description: 'Нельзя удалить себя или последнего администратора.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Администратор удалён' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Удаление себя или последнего администратора запрещено' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Пользователь не найден' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request): Promise<void> {
    await this.users.deleteAdmin(id, (req.user as AuthUser).userId);
  }
}
