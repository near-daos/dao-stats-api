import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DatabaseValidationSchema } from './db.schema';

export class AggregatorValidationSchema extends DatabaseValidationSchema {
  @IsNumber()
  @IsNotEmpty()
  AGGREGATOR_POLLING_INTERVAL: number;

  @IsString()
  @IsNotEmpty()
  REDIS_EVENT_BUS_URL: string;
}
