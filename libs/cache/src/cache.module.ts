import { CacheModule, Module } from '@nestjs/common';
import { CacheConfigService } from '@dao-stats/config/api-config';

import { RedisModule } from '@dao-stats/redis';
import { CacheService } from './cache.service';

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
