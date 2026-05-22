import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from '../telegram/telegram.module';
import { Bot } from './bot.entity';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bot]), TelegramModule],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
