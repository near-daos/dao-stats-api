import { AggregationOutput } from './aggregation-output.interface';

export declare class Aggregator {
  /**
   * Aggregating data with the given time interval.
   * @constructor
   * @param {number} from - The title of the book.
   * @param {number} to - The author of the book.
   */
  aggregate(from?: number, to?: number): Promise<AggregationOutput>;
}
