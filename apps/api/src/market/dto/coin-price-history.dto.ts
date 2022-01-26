import { ApiProperty } from '@nestjs/swagger';

import { CoinType, CurrencyType } from '@dao-stats/common';

export class CoinPriceHistoryResponse {
  @ApiProperty()
  date: number;

  @ApiProperty()
  coin: CoinType;

  @ApiProperty()
  currency: CurrencyType;

  @ApiProperty()
  price: number;
}
