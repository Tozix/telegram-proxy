import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../../generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LoginResponseDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Неверные учётные данные');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Подтвердите email перед входом');
    }
    return user;
  }

  /** Public self-registration: creates an unverified user and emails a link. */
  async register(email: string, password: string): Promise<{ message: string }> {
    const { user, token } = await this.users.registerUser(email, password);
    await this.mail.sendVerificationEmail(user.email, token);
    return { message: 'Регистрация успешна. Проверьте почту и подтвердите email.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.users.verifyEmail(token);
    return { message: 'Email подтверждён. Теперь можно войти.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const res = await this.users.refreshVerification(email);
    if (res) await this.mail.sendVerificationEmail(res.user.email, res.token);
    // Не раскрываем, существует ли аккаунт.
    return { message: 'Если аккаунт не подтверждён, письмо отправлено повторно.' };
  }

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.validateUser(email, password);
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.expiresInSeconds(),
    };
  }

  private expiresInSeconds(): number {
    const raw = this.config.get<string>('jwt.expiresIn') ?? '7d';
    const match = /^(\d+)([smhd])?$/.exec(raw.trim());
    if (!match) return 0;
    const value = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 1);
  }
}
