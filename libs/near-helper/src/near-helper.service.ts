import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cacheable } from '@type-cacheable/core';
import { NearConfigService } from '@dao-stats/near';

@Injectable()
export class NearHelperService {
  readonly env: string;
  readonly baseURI: string;

  constructor(
    private readonly nearConfigService: NearConfigService,
    private readonly httpService: HttpService,
  ) {
    this.env = this.nearConfigService.env;
    this.baseURI = this.nearConfigService.connectConfig.helperUrl;
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `likely_tokens:${context.env}:${accountId}`,
  })
  async getLikelyTokens(accountId: string): Promise<string[]> {
    const url = `${this.baseURI}/account/${accountId}/likelyTokens`;
    const { data } = await this.httpService.get(url).toPromise();
    return data;
  }

  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `likely_nfts:${context.env}:${accountId}`,
  })
  async getLikelyNFTs(accountId: string): Promise<string[]> {
    const url = `${this.baseURI}/account/${accountId}/likelyNFTs`;
    const { data } = await this.httpService.get(url).toPromise();
    return data;
  }
}
