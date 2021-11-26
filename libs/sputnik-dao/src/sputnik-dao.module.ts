import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AggregationService } from '.';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
