import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BotsModule } from './bots/bots.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health.controller';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProxyModule } from './proxy/proxy.module';
import { PublicConfigController } from './public-config.controller';
import { RedisModule } from './redis/redis.module';
import { StatsModule } from './stats/stats.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    UsersModule,
    AuthModule,
    TelegramModule,
    BotsModule,
    ProxyModule,
    StatsModule,
  ],
  controllers: [HealthController, PublicConfigController],
})
export class AppModule {}
