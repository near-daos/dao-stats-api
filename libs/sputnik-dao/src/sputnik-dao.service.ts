import { Injectable } from '@nestjs/common';
import {
  Aggregator,
  DaoDto,
  DaoStatsDto,
  TransactionDto,
} from '@dao-stats/common';

@Injectable()
export class AggregationService implements Aggregator {
  aggregateMetrics(): AsyncGenerator<DaoStatsDto> {
    return undefined;
  }

  async getDaos(): Promise<DaoDto[]> {
    return [];
  }

  aggregateTransactions(): AsyncGenerator<TransactionDto[]> {
    return undefined;
  }
}
