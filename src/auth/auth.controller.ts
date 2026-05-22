import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Регистрация',
    description: 'Создаёт пользователя (роль `user`) и отправляет письмо для подтверждения email.',
  })
  @ApiCreatedResponse({ type: MessageResponseDto, description: 'Письмо отправлено' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email уже зарегистрирован' })
  register(@Body() dto: RegisterDto): Promise<MessageResponseDto> {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение email', description: 'Подтверждает email по токену из письма.' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Email подтверждён' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Недействительный или просроченный токен' })
  verify(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
    return this.auth.verifyEmail(dto.token);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Повторная отправка письма', description: 'Повторно отправляет письмо подтверждения, если email ещё не подтверждён.' })
  @ApiOkResponse({ type: MessageResponseDto })
  resend(@Body() dto: ResendVerificationDto): Promise<MessageResponseDto> {
    return this.auth.resendVerification(dto.email);
  }

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
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Email не подтверждён' })
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
