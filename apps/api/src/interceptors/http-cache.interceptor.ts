import { Reflector } from '@nestjs/core';
import {
  CACHE_KEY_METADATA,
  CacheInterceptor,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@dao-stats/cache';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  constructor(
    protected readonly cacheManager: CacheService,
    protected readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(cacheManager, reflector);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const cacheKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (cacheKey) {
      const request = context.switchToHttp().getRequest();
      return `${cacheKey}-${request._parsedUrl.query}`;
    }

    return super.trackBy(context);
  }

  isRequestCacheable(): boolean {
    return !['dev', 'development', 'local'].includes(
      this.configService.get('environment'),
    );
  }
}
