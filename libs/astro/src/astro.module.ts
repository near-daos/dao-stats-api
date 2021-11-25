import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  providers: [AggregationService, NearIndexerDBProvider, NearIndexerService],
  exports: [AggregationService],
})
export class AggregationModule {}
