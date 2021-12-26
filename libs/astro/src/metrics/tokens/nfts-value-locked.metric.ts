import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearHelperService } from '@dao-stats/near-helper';
import { AstroService } from '../../astro.service';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class NftsValueLockedMetric implements DaoContractMetricInterface {
  constructor(
    private readonly astroService: AstroService,
    private readonly nearHelperService: NearHelperService,
  ) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.NftsValueLocked;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const tokens = await this.nearHelperService.getLikelyNFTs(
      contract.contractId,
    );
    const nftData = await Promise.all(
      tokens.map(async (token) => {
        const tokenContract = await this.astroService.getNfTokenContract(token);
        try {
          const nfts = await tokenContract.getTokensForOwner(
            contract.contractId,
          );
          return [token, tokenContract, nfts];
        } catch (err) {
          return [];
        }
      }),
    );
    // TODO: get prices of NFTs
    return 0;
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
