import { DAOStatsDto, TransactionDto } from '../dto';

export declare class AggregationOutput {
  transactions: TransactionDto[];
  metrics: DAOStatsDto[];
}
