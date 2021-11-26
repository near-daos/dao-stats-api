import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import configuration, {
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/aggregator-config';

import { AggregatorService } from './aggregator.service';
import { AggregatorValidationSchema } from '@dao-stats/config/validation';
import { RedisModule } from 'libs/redis/src/redis.module';
import { TransactionModule } from 'libs/transaction/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      validate: (config) => validate(AggregatorValidationSchema, config),
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    TransactionModule,
  ],
  providers: [AggregatorService],
})
export class AggregatorModule {}
