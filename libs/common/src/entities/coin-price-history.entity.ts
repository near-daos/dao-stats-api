import { Column, Entity, PrimaryColumn } from 'typeorm';
import { CoinType } from '../types/coin-type';
import { CurrencyType } from '../types/currency-type';

@Entity({ name: 'coin_price_history' })
export class CoinPriceHistory {
  @PrimaryColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date?: Date;

  @PrimaryColumn({ type: 'text' })
  coin: CoinType;

  @PrimaryColumn({ type: 'text' })
  currency: CurrencyType;

  @Column({ type: 'decimal', nullable: false, default: 0 })
  price: number;
}
