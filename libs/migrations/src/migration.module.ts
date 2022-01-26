import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import configuration, {
  TypeOrmConfigService,
} from '@dao-stats/config/aggregator-config';
import { HttpCacheModule } from '@dao-stats/cache';
import {
  CoinPriceHistoryModule,
  Contract,
  ContractModule,
  DaoStatsHistoryModule,
  Receipt,
  ReceiptAction,
  Transaction,
} from '@dao-stats/common';
import { ExchangeModule } from '@dao-stats/exchange';
import migrationScripts from './scripts';

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
    ContractModule,
    DaoStatsHistoryModule,
    HttpCacheModule,
    ExchangeModule,
    CoinPriceHistoryModule,
  ],
  providers: [...migrationScripts],
})
export class MigrationModule {}
