import { tap } from 'rxjs';
import { Cache } from 'cache-manager';
import { EVENT_CACHE_CLEAR } from '@dao-stats/common';
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@dao-stats/redis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisService: RedisService,
  ) {
    this.redisService
      .fromEvent(EVENT_CACHE_CLEAR)
      .pipe(tap((eventInfo) => this.clearCache(eventInfo)))
      .subscribe();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clearCache(eventInfo?: any): Promise<any> {
    this.logger.log('Clearing cache...');

    return this.cacheManager.reset();
  }
}
