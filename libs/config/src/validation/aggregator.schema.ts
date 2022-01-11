import { IsNotEmpty, IsString } from 'class-validator';
import { DatabaseValidationSchema } from './db.schema';

export class AggregatorValidationSchema extends DatabaseValidationSchema {
  @IsString()
  @IsNotEmpty()
  AGGREGATOR_POLLING_SCHEDULE: string;

  @IsString()
  @IsNotEmpty()
  REDIS_EVENT_BUS_URL: string;

  @IsString()
  @IsNotEmpty()
  SMART_CONTRACTS: string;
}
