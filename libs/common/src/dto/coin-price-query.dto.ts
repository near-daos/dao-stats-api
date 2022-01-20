import { ApiProperty } from '@nestjs/swagger';
import { MetricQuery } from './metric-query.dto';
import { CurrencyType } from '../types/currency-type';

export class CoinPriceQuery extends MetricQuery {
  @ApiProperty({
    type: CurrencyType,
    required: true,
    description: `Currency Type: e.g ${CurrencyType.USD}`,
    enum: Object.keys(CurrencyType),
  })
  currency: CurrencyType;
}
