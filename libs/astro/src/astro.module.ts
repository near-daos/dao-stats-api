import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { nearProvider, nearRPCProvider } from '@dao-stats/config/near';
import { AggregationService } from '.';
import configuration from './config/configuration';
import { NearIndexerDBProvider } from './db.provider';
import { NearIndexerService } from './near-indexer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    AggregationService,
    NearIndexerService,
    NearIndexerDBProvider,
    nearProvider,
    nearRPCProvider,
  ],
  exports: [AggregationService],
})
export class AggregationModule {}
