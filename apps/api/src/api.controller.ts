import { HttpCacheInterceptor } from '@dao-stats/common/interceptors/httpCache.interceptor';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor() {}

  @ApiExcludeEndpoint()
  @UseInterceptors(HttpCacheInterceptor)
  @Get()
  main(): string {
    return 'DAO Stats API v1.0';
  }
}
