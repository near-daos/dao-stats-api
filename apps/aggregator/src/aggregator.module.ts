import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import configuration, {
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/aggregator-config';

import { AggregatorValidationSchema } from '@dao-stats/config/validation';
import { RedisModule } from '@dao-stats/redis';
import { TransactionModule } from '@dao-stats/transaction';
import { HttpCacheModule } from '@dao-stats/cache';
import {
  DaoStatsModule,
  DaoStatsHistoryModule,
  DaoModule,
} from '@dao-stats/common';
import { AggregatorService } from './aggregator.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ReceiptModule } from '@dao-stats/receipt';

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
    ReceiptModule,
    DaoModule,
    DaoStatsModule,
    DaoStatsHistoryModule,
    HttpCacheModule,
  ],
  providers: [
    AggregatorService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AggregatorModule {}
