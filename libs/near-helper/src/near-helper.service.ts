import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

import { NearConfigService } from '@dao-stats/near';

@Injectable()
export class NearHelperService {
  baseURI: string;

  constructor(
    private readonly nearConfigService: NearConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseURI = this.nearConfigService.connectConfig.helperUrl;
  }

  async getLikelyTokens(accountId: string): Promise<string[]> {
    const url = `${this.baseURI}/account/${accountId}/likelyTokens`;
    const { data } = await this.httpService.get(url).toPromise();
    return data;
  }

  async getLikelyNFTs(accountId: string): Promise<string[]> {
    const url = `${this.baseURI}/account/${accountId}/likelyNFTs`;
    const { data } = await this.httpService.get(url).toPromise();
    return data;
  }
}
