import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cacheable } from '@type-cacheable/core';

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
    const baseUri = this.configService.get<string>('sodaki.baseUri');

    return lastValueFrom(
      this.httpService.get(`${baseUri}/last-tvl`).pipe(map((res) => res.data)),
    );
  }

  @Cacheable({
    ttlSeconds: 30,
  })
  async getSpotPrices(): Promise<any> {
    const baseUri = this.configService.get<string>('sodaki.baseUri');
    return lastValueFrom(
      this.httpService
        .get(`${baseUri}/spot-price`)
        .pipe(map((res) => res.data)),
    );
  }

  async getToken(accountId: string): Promise<number> {
    const tokenPrices = await this.getTokenPrices();
    return parseFloat(
      tokenPrices.find((info) => info.token_account_id === accountId)?.price ||
        '0',
    );
  }
  async getTokenPrice(accountId: string): Promise<number> {
    const tokenPrices = await this.getTokenPrices();
    return parseFloat(
      tokenPrices.find((info) => info.token_account_id === accountId)?.price ||
        '0',
    );
  }

  async getSpotPrice(symbol): Promise<number> {
    const spotPrices = await this.getSpotPrices();
    return parseFloat(
      spotPrices.find((info) => info.symbol === symbol)?.price || '0',
    );
  }

  async getNearPrice(): Promise<number> {
    return this.getSpotPrice('NEARBUSD');
  }
}
