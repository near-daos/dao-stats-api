import { AggregationOutput } from './aggregation-output.interface';

export declare class Aggregator {
  aggregate(): Promise<AggregationOutput>;
}
