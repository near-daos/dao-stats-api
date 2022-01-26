import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cacheable } from '@type-cacheable/core';
import { CoinType, CurrencyType } from '@dao-stats/common';
import { ExchangeConfig } from '@dao-stats/config/exchange-config';
import { SodakiCoinTypeSymbol } from './types';

@Injectable()
export class SodakiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Cacheable({
    ttlSeconds: 30,
  })
  async getTokenPrices(): Promise<any> {
    return lastValueFrom(
      this.httpService
        .get(`${this.getBaseUri()}/last-tvl`)
        .pipe(map((res) => res.data)),
    );
  }

  @Cacheable({
    ttlSeconds: 30,
  })
  async getSpotPrices(): Promise<any> {
    return lastValueFrom(
      this.httpService
        .get(`${this.getBaseUri()}/spot-price`)
        .pipe(map((res) => res.data)),
    );
  }

  async getToken(accountId: string): Promise<number> {
    const tokenPrices = await this.getTokenPrices();
    return parseFloat(
      tokenPrices.find(
        (info: { token_account_id: string }) =>
          info.token_account_id === accountId,
      )?.price || '0',
    );
  }

  async getTokenPrice(accountId: string): Promise<number> {
    const tokenPrices = await this.getTokenPrices();
    return parseFloat(
      tokenPrices.find(
        (info: { token_account_id: string }) =>
          info.token_account_id === accountId,
      )?.price || '0',
    );
  }

  async getSpotPrice(symbol: string): Promise<number> {
    const spotPrices = await this.getSpotPrices();
    return parseFloat(
      spotPrices.find((info: { symbol: string }) => info.symbol === symbol)
        ?.price || '0',
    );
  }

  async getCoinSpotPrice(
    coin: CoinType,
    currency: CurrencyType,
  ): Promise<number> {
    return this.getSpotPrice(`${SodakiCoinTypeSymbol[coin]}${currency}`);
  }

  private getBaseUri(): string {
    return this.configService.get<ExchangeConfig>('exchange')?.sodakiApiBaseUrl;
  }
}
