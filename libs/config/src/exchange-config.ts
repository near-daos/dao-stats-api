import { registerAs } from '@nestjs/config';

export { default as validate } from './validation-schema';
export { TypeOrmConfigService } from './typeorm-config.service';
export { CacheConfigService } from './cache';

export type ExchangeConfig = {
  sodakiApiBaseUrl: string;
  coingeckoApiBaseUrl: string;
};

const exchange = registerAs('exchange', () => {
  return {
    sodakiApiBaseUrl: process.env.SODAKI_API_BASE_URL,
    coingeckoApiBaseUrl: process.env.COINGECKO_API_BASE_URL,
  } as ExchangeConfig;
});

export default exchange;
