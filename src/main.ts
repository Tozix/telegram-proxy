import 'reflect-metadata';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { ApiProxyService } from './proxy/api-proxy.service';
import { UsersService } from './users/users.service';

// Matches /bot<token>/... and /file/bot<token>/... (token starts with the numeric bot id).
const TELEGRAM_PROXY_PATH = /^\/(?:file\/)?bot\d+:/;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // bodyParser disabled so the transparent proxy can read raw request streams
  // (multipart uploads etc.) before any parser consumes them.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const proxy = app.get(ApiProxyService);

  const maxUploadMb = config.get<number>('proxy.maxUploadMb')!;
  const bodyLimit = `${maxUploadMb}mb`;

  // 1) Transparent Telegram Bot API proxy — must run before the JSON parser.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (TELEGRAM_PROXY_PATH.test(req.path)) {
      proxy.handle(req, res).catch((err: Error) => {
        logger.error(`Unhandled proxy error: ${err.message}`);
        if (!res.headersSent) {
          res.status(502).type('application/json').send(
            JSON.stringify({ ok: false, error_code: 502, description: 'Bad Gateway' }),
          );
        }
      });
      return;
    }
    next();
  });

  // 2) Body parsers for the admin API, auth and incoming Telegram webhooks.
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // Applies class-transformer rules (@Expose/@Exclude/@Transform) to every
  // response that is a class instance — DTOs and entities alike.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Telegram Proxy API')
    .setDescription(
      [
        'Admin API for the Telegram webhook & Bot API proxy hosted at **telegram.crossmark.ru**.',
        '',
        '### Authentication',
        'Call `POST /auth/login` to obtain a JWT, then click **Authorize** and paste the token.',
        '',
        '### Transparent proxy (not listed below)',
        'Two passthrough surfaces are handled outside the documented controllers:',
        '- `POST /webhook/{secret}` — receives updates from Telegram and forwards them to the bot backend.',
        '- `ANY /bot{token}/{method}` and `/file/bot{token}/{path}` — a drop-in replacement for ' +
          '`api.telegram.org`; every Bot API method (incl. multipart uploads) is proxied verbatim.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addTag('auth', 'Authentication & current user')
    .addTag('bots', 'Manage proxied bots, webhooks and delivery logs')
    .addTag('health', 'Liveness')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Telegram Proxy API',
  });

  // Seed the initial admin user from env if the table is empty.
  await app.get(UsersService).ensureAdmin();

  const port = config.get<number>('port')!;
  await app.listen(port, '0.0.0.0');
  logger.log(`Telegram proxy listening on http://0.0.0.0:${port}`);
  logger.log(`Swagger UI available at /docs`);
}

void bootstrap();
