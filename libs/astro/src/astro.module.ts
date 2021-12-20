import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NearModule } from '@dao-stats/near';

import { AstroService } from './astro.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    NearModule,
  ],
  providers: [AstroService],
  exports: [AstroService],
})
export class AstroModule {}
