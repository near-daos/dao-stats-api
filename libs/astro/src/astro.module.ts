import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  NearIndexerDBProvider,
  NearIndexerService,
} from '@dao-stats/near-indexer';
import { NearHelperModule } from '@dao-stats/near-helper';
import { AggregationService } from '.';
import { AstroDaoModule } from './astro-dao.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    AstroDaoModule,
    NearHelperModule,
  ],
  providers: [AggregationService, NearIndexerService, NearIndexerDBProvider],
  exports: [AggregationService],
})
export class AggregationModule {}
