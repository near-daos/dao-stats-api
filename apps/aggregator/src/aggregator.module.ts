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
import { CoinPriceHistoryModule } from '@dao-stats/common/coin-price-history.module';
import { ContractModule } from 'apps/api/src/contract/contract.module';
import { ExchangeModule } from 'libs/exchange/src/exchange.module';

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
    CoinPriceHistoryModule,
    ContractModule,
    ExchangeModule,
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
