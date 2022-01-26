import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NearModule } from '@dao-stats/near';

import { AstroService } from './astro.service';
import configuration from './config/configuration';
import exchange from '@dao-stats/config/exchange-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, exchange],
    }),
    NearModule,
  ],
  providers: [AstroService],
  exports: [AstroService],
})
export class AstroModule {}
