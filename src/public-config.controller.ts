import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

export class PublicConfigDto {
  @ApiProperty({
    example: 'https://proxy.example.com',
    description: 'Публичный адрес прокси (PUBLIC_BASE_URL) — подставляется в примеры документации.',
  })
  proxyHost!: string;
}

/**
 * Public, unauthenticated configuration the web UI needs before login.
 * Lets the docs/landing show the REAL deployed domain (PUBLIC_BASE_URL) instead
 * of a placeholder — the same origin Telegram uses to reach this service.
 */
@ApiTags('health')
@Controller()
export class PublicConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get('public-config')
  @ApiOperation({ summary: 'Публичная конфигурация', description: 'Адрес прокси для документации. Без авторизации.' })
  @ApiOkResponse({ type: PublicConfigDto })
  publicConfig(): PublicConfigDto {
    return { proxyHost: this.config.get<string>('publicBaseUrl')! };
  }
}
