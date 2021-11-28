import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AstroDAOService } from '@dao-stats/astro/astro-dao.service';
import { nearProvider, nearRPCProvider } from '@dao-stats/config/near';

import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [AstroDAOService, nearProvider, nearRPCProvider],
  exports: [AstroDAOService],
})
export class AstroDAOModule {}
