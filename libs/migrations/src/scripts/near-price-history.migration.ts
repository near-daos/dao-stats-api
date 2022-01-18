import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '@dao-stats/common';
import { Migration } from '..';
import { CoinPriceHistoryService } from '@dao-stats/common/coin-price-history.service';
import { CoinGeckoService } from 'libs/exchange/src';
import { CoinType } from '@dao-stats/common/types/coin-type';
import { CurrencyType } from '@dao-stats/common/types/currency-type';
import moment from 'moment';

@Injectable()
export class NearPriceHistoryMigration implements Migration {
  private readonly logger = new Logger(NearPriceHistoryMigration.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly coinPriceHistoryService: CoinPriceHistoryService,
    private readonly coinGeckoService: CoinGeckoService,
  ) {}

  public async migrate(): Promise<void> {
    this.logger.log('Starting coin price history migration...');

    const FALLBACK_FROM_DATE = 1622561635403477336; // astro launch date
    const { blockTimestamp = FALLBACK_FROM_DATE } =
      (await this.transactionRepository.findOne({
        where: {
          contractId: 'astro',
        },
        order: { blockTimestamp: 'ASC' },
      })) || {};

    const prices = await this.coinGeckoService.getCoinPriceHistory(
      CoinType.Near,
      CurrencyType.USD,
      Math.round(Number(blockTimestamp) / Math.pow(10, 9)), // unix-time
      Math.round(new Date().getTime() / Math.pow(10, 3)), // unix-time
    );

    await Promise.all(
      prices.map(([timestamp, price]) =>
        this.coinPriceHistoryService.createOrUpdate({
          coin: CoinType.Near,
          currency: CurrencyType.USD,
          price,
          date: moment(timestamp).format('YYYY-MM-DD'),
        }),
      ),
    );

    this.logger.log('Finished coin price history migration.');
  }
}
