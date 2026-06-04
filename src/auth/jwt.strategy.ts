import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiTokensService } from '../api-tokens/api-tokens.service';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  /** Present only on static API tokens — equals the api_tokens row id; used to revoke. */
  jti?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
    private readonly apiTokens: ApiTokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь больше не существует');
    }
    // Static API tokens carry a `jti`; reject if the token was revoked (row deleted).
    if (payload.jti) {
      await this.apiTokens.assertActive(payload.jti);
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
