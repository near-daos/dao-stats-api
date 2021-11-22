import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DatabaseValidationSchema } from './db.schema';

export class ApiValidationSchema extends DatabaseValidationSchema {
  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  REDIS_CACHE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_EVENT_BUS_URL: string;

  @IsNumber()
  REDIS_HTTP_CACHE_TTL: number;
}
