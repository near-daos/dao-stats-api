import { CoinType } from '@dao-stats/common/types/coin-type';
import { CurrencyType } from '@dao-stats/common/types/currency-type';
import { ApiProperty } from '@nestjs/swagger';

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
