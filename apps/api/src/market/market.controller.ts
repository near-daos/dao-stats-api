import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CoinType, CoinPriceQuery } from '@dao-stats/common';

import { MarketService } from './market.service';
import { NoContractContext } from '../decorators';
import { MetricQueryPipe } from '../pipes';
import { CoinPriceHistoryResponse } from './dto';

@ApiTags('Market')
@Controller('/api/v1/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @ApiResponse({
    status: 200,
    type: [CoinPriceHistoryResponse],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request Response based on the query params set',
  })
  @ApiParam({
    name: 'coin',
    description: `Coin Type: e.g ${CoinType.Near}`,
    enum: Object.values(CoinType),
  })
  @NoContractContext()
  @Get('/:coin/price')
  async coinPrice(
    @Param('coin') coin: CoinType = CoinType.Near,
    @Query(MetricQueryPipe) query: CoinPriceQuery,
  ): Promise<CoinPriceHistoryResponse[]> {
    return this.marketService.getCoinPriceHistory(coin, query);
  }
}
