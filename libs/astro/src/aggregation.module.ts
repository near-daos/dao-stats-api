import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NearIndexerModule } from '@dao-stats/near-indexer';
import { NearHelperModule } from '@dao-stats/near-helper';
import { AggregationService } from '.';
import { AstroModule } from './astro.module';
import configuration from './config/configuration';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
    AstroModule,
    NearIndexerModule,
    NearHelperModule,
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
