import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cacheable } from '@type-cacheable/core';
import { CoinType, CurrencyType } from '@dao-stats/common';
import { ExchangeConfig } from '@dao-stats/config/exchange-config';

@Injectable()
export class CoinGeckoService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Cacheable({
    ttlSeconds: 30,
  })
  async getCoinPrice(type: CoinType, currency: CurrencyType): Promise<any> {
    return lastValueFrom(
      this.httpService
        .get(
          `${this.getBaseUri()}/simple/price?ids=${type.toLowerCase()}&vs_currencies=${currency.toLowerCase()}`,
        )
        .pipe(
          map(
            (res) => res.data?.[type.toLowerCase()]?.[currency.toLowerCase()],
          ),
        ),
    );
  }

  @Cacheable({
    ttlSeconds: 30,
  })
  async getCoinPriceHistory(
    type: CoinType,
    currency: CurrencyType,
    from: number,
    to: number,
  ): Promise<any> {
    return lastValueFrom(
      this.httpService
        .get(
          `${this.getBaseUri()}/coins/${type.toLowerCase()}/market_chart/range?vs_currency=${currency.toLowerCase()}&from=${from}&to=${to}`,
        )
        .pipe(map((res) => res.data?.prices)),
    );
  }

  private getBaseUri(): string {
    return this.configService.get<ExchangeConfig>('exchange')
      ?.coingeckoApiBaseUrl;
  }
}
