import { CacheModule, Module } from '@nestjs/common';
import { CacheConfigService } from '@dao-stats/config/api-config';

import { CacheService } from './cache.service';
import { RedisModule } from 'libs/redis/src/redis.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    RedisModule,
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class HttpCacheModule {}
