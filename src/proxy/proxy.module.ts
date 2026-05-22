import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsModule } from '../bots/bots.module';
import { ApiProxyService } from './api-proxy.service';
import { DeliveryLog } from './delivery-log.entity';
import { DeliveryLogsController } from './delivery-logs.controller';
import { DeliveryLogsService } from './delivery-logs.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryLog]), BotsModule],
  controllers: [WebhookController, DeliveryLogsController],
  providers: [WebhookService, ApiProxyService, DeliveryLogsService],
  exports: [ApiProxyService],
})
export class ProxyModule {}
