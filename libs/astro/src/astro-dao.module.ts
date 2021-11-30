import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  nearProvider,
  nearRPCProvider,
  NearConfigService,
} from '@dao-stats/near';

import { AstroDAOService } from './astro-dao.service';

import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    NearConfigService,
    AstroDAOService,
    nearProvider,
    nearRPCProvider,
  ],
  exports: [AstroDAOService, nearProvider, nearRPCProvider],
})
export class AstroDAOModule {}
