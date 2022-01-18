import { Injectable } from '@nestjs/common';

import { CoinPriceHistoryService } from '@dao-stats/common/coin-price-history.service';
import { CoinPriceQuery } from '@dao-stats/common/dto/coin-price-query.dto';
import { CoinPriceHistoryResponse } from './dto';
import { CoinType } from '@dao-stats/common/types/coin-type';
import moment from 'moment';

@Injectable()
export class MarketService {
  constructor(
    private readonly coinPriceHistoryService: CoinPriceHistoryService,
  ) {}

  async getCoinPriceHistory(
    coin: CoinType,
    query: CoinPriceQuery,
  ): Promise<CoinPriceHistoryResponse[]> {
    const { currency, from, to } = query;

    const history = await this.coinPriceHistoryService.findByDateRange(
      coin,
      currency,
      from,
      to,
    );

    return history.map((price) => ({
      ...price,
      date: moment(price.date).valueOf(),
    }));
  }
}
