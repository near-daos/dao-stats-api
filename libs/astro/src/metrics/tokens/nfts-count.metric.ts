import { Injectable, Logger } from '@nestjs/common';
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
export class NftsCountMetric implements DaoContractMetricInterface {
  private readonly logger = new Logger(NftsCountMetric.name);

  constructor(
    private readonly astroService: AstroService,
    private readonly nearHelperService: NearHelperService,
  ) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.NftsCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    const tokens = await this.nearHelperService.getLikelyNFTs(
      contract.contractId,
    );
    const nfts = (
      await Promise.all(
        tokens.map(async (token) => {
          const tokenContract = await this.astroService.getNfTokenContract(
            token,
          );
          try {
            return await tokenContract.getTokensForOwner(contract.contractId);
          } catch (err) {
            if (err.type === 'UntypedError') {
              this.logger.warn(
                `Unable to get NFT for owner ${
                  contract.contractId
                } and token ${token}: ${String(err)}`,
              );
              return [];
            } else {
              throw err;
            }
          }
        }),
      )
    ).flat();
    return nfts.length;
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
