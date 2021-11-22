import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  REDIS_PUBLISHER_CLIENT,
  REDIS_SUBSCRIBER_CLIENT,
} from './redis.constants';

export type RedisClient = Redis.Redis;

const initRedisClient = (configService): RedisClient => {
  const {
    redisHost: host,
    redisPort: port,
    redisDB: db,
    redisPassword: password,
  } = configService.get('redis');

  return new Redis({ host, port, db, password });
};

export const redisProviders: Provider[] = [
  {
    useFactory: (configService: ConfigService): RedisClient =>
      initRedisClient(configService),
    inject: [ConfigService],
    provide: REDIS_SUBSCRIBER_CLIENT,
  },
  {
    useFactory: (configService: ConfigService): RedisClient =>
      initRedisClient(configService),
    inject: [ConfigService],
    provide: REDIS_PUBLISHER_CLIENT,
  },
];
