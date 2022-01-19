import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract, CoinPriceHistoryModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { MarketService } from './market.service';
import { MarketController } from './market.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    CoinPriceHistoryModule,
    TransactionModule,
  ],
  providers: [MarketService],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
