import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NearModule } from '@dao-stats/near';

import { AstroDaoService } from './astro-dao.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    NearModule,
  ],
  providers: [AstroDaoService],
  exports: [AstroDaoService],
})
export class AstroDaoModule {}
