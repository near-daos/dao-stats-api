import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NearModule } from '@dao-stats/near';

import { AstroDAOService } from './astro-dao.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    NearModule,
  ],
  providers: [AstroDAOService],
  exports: [AstroDAOService],
})
export class AstroDAOModule {}
