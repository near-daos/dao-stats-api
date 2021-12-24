import { Injectable } from '@nestjs/common';
import { DaoStatsMetric, convertFunds } from '@dao-stats/common';
import { NearService } from '@dao-stats/near';
import { NearHelperService } from '@dao-stats/near-helper';
import { AstroService } from '../../astro.service';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class FtsValueLockedMetric implements DaoContractMetricInterface {
  constructor(
    private readonly astroService: AstroService,
    private readonly nearService: NearService,
    private readonly nearHelperService: NearHelperService,
  ) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.FtsValueLocked;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const tokens = await this.nearHelperService.getLikelyTokens(
      contract.contractId,
    );
    const nearPrice = await this.nearService.getNearPrice();
    const tokenBalances = await Promise.all(
      tokens.map(async (token) => {
        const fTokenContract = await this.astroService.getFTokenContract(token);
        const [metadata, balance, price] = await Promise.all([
          fTokenContract.getMetadata(),
          fTokenContract.getBalance(contract.contractId),
          this.nearService.getTokenPrice(token),
        ]);
        const tokenBalance = convertFunds(
          balance,
          metadata.decimals,
        ).toNumber();
        return (tokenBalance * price) / nearPrice;
      }),
    );
    return tokenBalances.reduce((prev, cur) => prev + cur, 0);
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
