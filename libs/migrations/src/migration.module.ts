import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import configuration, {
  TypeOrmConfigService,
} from '@dao-stats/config/aggregator-config';
import {
  Contract,
  Transaction,
  Receipt,
  ReceiptAction,
  DaoStatsHistoryModule,
} from '@dao-stats/common';
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
    DaoStatsHistoryModule,
  ],
  providers: [...migrationScripts],
})
export class MigrationModule {}
