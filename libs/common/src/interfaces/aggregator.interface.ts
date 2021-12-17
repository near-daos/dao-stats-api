import { DaoStatsDto, TransactionDto } from '@dao-stats/common';

export declare class Aggregator {
  aggregateTransactions(
    from?: bigint,
    to?: bigint,
  ): AsyncGenerator<TransactionDto[]>;

  aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto[]>;
}
