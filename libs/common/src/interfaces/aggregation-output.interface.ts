import { DaoStatsDto, TransactionDto } from '../dto';

export declare class AggregationOutput {
  transactions: TransactionDto[];
  metrics: DaoStatsDto[];
}
