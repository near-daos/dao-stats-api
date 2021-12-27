import { registerAs } from '@nestjs/config';
import { default as configuration } from './configuration';
import { default as database } from './database';
import { default as redis } from './redis-config';

export { default as validate } from './validation-schema';
export { TypeOrmConfigService } from './typeorm-config.service';
export { CacheConfigService } from './cache';

const aggregator = registerAs('aggregator', () => {
  return {
    pollingInterval: parseInt(process.env.AGGREGATOR_POLLING_INTERVAL, 10),
    smartContracts: process.env.SMART_CONTRACTS.split(','),
  };
});

export default [configuration, database, aggregator, redis];
