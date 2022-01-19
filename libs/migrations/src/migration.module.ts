import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import configuration, {
  TypeOrmConfigService,
} from '@dao-stats/config/aggregator-config';
import { HttpCacheModule } from '@dao-stats/cache';
import {
  Contract,
  Transaction,
  Receipt,
  ReceiptAction,
  DaoStatsHistoryModule,
} from '@dao-stats/common';
import migrationScripts from './scripts';
import { ExchangeModule } from 'libs/exchange/src/exchange.module';
import { CoinPriceHistoryModule } from '@dao-stats/common/coin-price-history.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forFeature([Contract, Transaction, Receipt, ReceiptAction]),
    DaoStatsHistoryModule,
    HttpCacheModule,
    ExchangeModule,
    CoinPriceHistoryModule,
  ],
  providers: [...migrationScripts],
})
export class MigrationModule {}
