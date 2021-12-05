import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  NearIndexerDBProvider,
  NearIndexerService,
} from '@dao-stats/near-indexer';
import { AggregationService } from '.';
import { AstroDaoModule } from './astro-dao.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    AstroDaoModule,
  ],
  providers: [AggregationService, NearIndexerService, NearIndexerDBProvider],
  exports: [AggregationService],
})
export class AggregationModule {}
