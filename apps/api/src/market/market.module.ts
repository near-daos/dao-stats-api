import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract } from '@dao-stats/common';

import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CoinPriceHistoryModule } from '@dao-stats/common/coin-price-history.module';
import { TransactionModule } from '@dao-stats/transaction';

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
