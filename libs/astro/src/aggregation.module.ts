import { ConfigModule } from '@nestjs/config';
import { CacheModule, Module } from '@nestjs/common';
import { NearModule } from '@dao-stats/near';
import { NearHelperModule } from '@dao-stats/near-helper';
import { NearIndexerModule } from '@dao-stats/near-indexer';
import { SodakiModule } from '@dao-stats/sodaki';

import { AggregationService, DAO_METRICS } from '.';
import { AstroModule } from './astro.module';
import configuration from './config/configuration';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
    AstroModule,
    NearModule,
    NearIndexerModule,
    NearHelperModule,
    SodakiModule,
  ],
  providers: [AggregationService, ...DAO_METRICS],
  exports: [AggregationService],
})
export class AggregationModule {}
