import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BotsModule } from './bots/bots.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health.controller';
import { ProxyModule } from './proxy/proxy.module';
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize'),
        logging: config.get<boolean>('database.logging'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
      }),
    }),
    UsersModule,
    AuthModule,
    TelegramModule,
    BotsModule,
    ProxyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
