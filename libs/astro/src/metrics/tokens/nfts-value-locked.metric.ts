import { Injectable, Logger } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearIndexerService } from '@dao-stats/near-indexer';
import { AstroService } from '../../astro.service';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class NftsValueLockedMetric implements DaoContractMetricInterface {
  private readonly logger = new Logger(NftsValueLockedMetric.name);

  constructor(
    private readonly astroService: AstroService,
    private readonly nearIndexerService: NearIndexerService,
  ) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.NftsValueLocked;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const tokens = await this.nearIndexerService.findLikelyNFTs(
      contract.contractId,
    );
    // eslint-disable-next-line
    const nftData = await Promise.all(
      tokens.map(async (token) => {
        const tokenContract = await this.astroService.getNfTokenContract(token);
        let nfts;
        try {
          nfts = await tokenContract.getTokensForOwner(contract.contractId);
        } catch (err) {
          if (err.type === 'UntypedError') {
            this.logger.warn(
              `Unable to get NFT for owner ${
                contract.contractId
              } and token ${token}: ${String(err)}`,
            );
            nfts = [];
          } else {
            throw err;
          }
        }
        return [token, tokenContract, nfts];
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
