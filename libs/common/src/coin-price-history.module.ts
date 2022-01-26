import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { CoinPriceHistory } from './entities/coin-price-history.entity';
import { CoinPriceHistoryService } from './coin-price-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoinPriceHistory])],
  providers: [CoinPriceHistoryService],
  exports: [CoinPriceHistoryService],
})
export class CoinPriceHistoryModule {}
