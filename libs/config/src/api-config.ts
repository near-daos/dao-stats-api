import { registerAs } from '@nestjs/config';
import { default as configuration } from './configuration';
import { default as database } from './database';
import { default as redis } from './redis-config';

export { default as validate } from './validation-schema';
export { TypeOrmConfigService } from './typeorm-config.service';
export { CacheConfigService } from './cache';

const api = registerAs('api', () => {
  return {
    port: parseInt(process.env.PORT, 10),
  };
});

export default [api, configuration, database, redis];
