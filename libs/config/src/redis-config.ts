import { registerAs } from '@nestjs/config';

import { parseRedisUrl } from 'parse-redis-url-simple';

export { default as validate } from './validation-schema';
export { TypeOrmConfigService } from './typeorm-config.service';
export { CacheConfigService } from './cache';

const redis = registerAs('redis', () => {
  const {
    host: redisHost,
    port: redisPort,
    database: redisDB,
    password: redisPassword,
  } = parseRedisUrl(process.env.REDIS_EVENT_BUS_URL)?.[0];

  return {
    redisHost,
    redisPort,
    redisDB,
    redisPassword,
  };
});

export default redis;
