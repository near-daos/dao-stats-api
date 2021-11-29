import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { nearProvider, nearRPCProvider } from '@dao-stats/config/near';
import { NearConfigService } from '@dao-stats/config/near-config.service';
import {
  NearIndexerDBProvider,
  NearIndexerService,
} from '@dao-stats/near-indexer';
import { AggregationService } from '.';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    NearConfigService,
    AggregationService,
    NearIndexerService,
    NearIndexerDBProvider,
    nearProvider,
    nearRPCProvider,
  ],
  exports: [AggregationService],
})
export class AggregationModule {}
