import { DaoDto, DaoStatsDto } from '@dao-stats/common';
import { ReceiptActionDto } from '../dto';

export declare class Aggregator {
  /**
   * TODO remove transaction collection logic when all transaction queries are converted to dao stats.
   * @deprecated
   */
  aggregateReceiptActions(
    from?: bigint,
    to?: bigint,
  ): AsyncGenerator<ReceiptActionDto[]>;

  getDaos(contractId: string): Promise<DaoDto[]>;

  aggregateMetrics(contractId: string): AsyncGenerator<DaoStatsDto>;
}
