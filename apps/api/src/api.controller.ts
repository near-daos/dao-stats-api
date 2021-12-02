import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { HttpCacheInterceptor } from '@dao-stats/common';

@Controller()
export class AppController {
  @ApiExcludeEndpoint()
  @UseInterceptors(HttpCacheInterceptor)
  @Get()
  main(): string {
    return 'DAO Stats API v1.0';
  }
}
