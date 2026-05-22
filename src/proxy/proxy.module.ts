import { Module } from '@nestjs/common';
import { BotsModule } from '../bots/bots.module';
import { ApiProxyService } from './api-proxy.service';
import { DeliveryLogsController } from './delivery-logs.controller';
import { DeliveryLogsService } from './delivery-logs.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [BotsModule],
  controllers: [WebhookController, DeliveryLogsController],
  providers: [WebhookService, ApiProxyService, DeliveryLogsService],
  exports: [ApiProxyService],
})
export class ProxyModule {}
