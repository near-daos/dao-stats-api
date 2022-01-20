import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { CoinPriceHistory } from './entities';
import { CoinType, CurrencyType } from './types';

@Injectable()
export class CoinPriceHistoryService {
  constructor(
    @InjectRepository(CoinPriceHistory)
    private readonly coinPriceHistoryRepository: Repository<CoinPriceHistory>,

    @InjectConnection()
    private connection: Connection,
  ) {}

  async find(coin: CoinType): Promise<CoinPriceHistory[]> {
    return this.coinPriceHistoryRepository.find({ where: { coin } });
  }

  async findByDateRange(
    coin: CoinType,
    currency: CurrencyType,
    from?: number,
    to?: number,
  ): Promise<CoinPriceHistory[]> {
    const query = this.coinPriceHistoryRepository.createQueryBuilder();

    query.where('coin = :coin', { coin });

    query.andWhere('currency = :currency', { currency });

    if (from) {
      query.andWhere('date >= to_timestamp(:from)::date', {
        from: from / 1000,
      });
    }

    if (to) {
      query.andWhere('date <= to_timestamp(:to)::date', {
        to: to / 1000,
      });
    }

    query.orderBy('date', 'ASC');

    return query.getMany();
  }

  async create(history: Partial<CoinPriceHistory>): Promise<CoinPriceHistory> {
    return this.coinPriceHistoryRepository.save(history);
  }

  async createOrUpdate(data: CoinPriceHistory): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(CoinPriceHistory)
      .values(data)
      .orUpdate({
        conflict_target: ['date', 'coin', 'currency'],
        overwrite: ['price'],
      })
      .execute();
  }
}
