import { DaoStatsDto, TransactionDto } from '@dao-stats/common';

export declare class Aggregator {
  /**
   * TODO remove transaction collection logic when all transaction queries are converted to dao stats.
   * @deprecated
   */
  aggregateTransactions(
    from?: bigint,
    to?: bigint,
  ): AsyncGenerator<TransactionDto[]>;

  aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto[]>;
}
