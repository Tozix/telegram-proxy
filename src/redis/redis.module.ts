import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Global so any module can inject {@link RedisService} without importing this
 * module explicitly.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
