import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вход',
    description: 'Обменивает email и пароль администратора на JWT bearer-токен для всех эндпоинтов `/api/*`.',
  })
  @ApiBody({
    type: LoginDto,
    examples: { default: { value: { email: 'admin@example.com', password: 'admin12345' } } },
  })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Авторизация успешна' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Неверные учётные данные' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь', description: 'Возвращает пользователя, определённого по bearer-токену.' })
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Токен отсутствует или неверный' })
  me(@Req() req: Request): AuthUserDto {
    return AuthUserDto.from(req.user as AuthUser);
  }
}
