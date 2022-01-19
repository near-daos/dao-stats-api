import { Injectable } from '@nestjs/common';
import moment from 'moment';

import {
  CoinPriceHistoryService,
  CoinPriceQuery,
  CoinType,
} from '@dao-stats/common';

import { CoinPriceHistoryResponse } from './dto';

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
