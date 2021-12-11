import { DaoStatsDto, TransactionDto } from '@dao-stats/common';

export declare class Aggregator {
  aggregateTransactions(
    from?: number,
    to?: number,
  ): AsyncGenerator<TransactionDto[]>;

  aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto[]>;
}
