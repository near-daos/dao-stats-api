import { Injectable } from '@nestjs/common';
import { DaoStatsMetric } from '@dao-stats/common';
import { NearHelperService } from '@dao-stats/near-helper';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class NftsCountMetric implements DaoContractMetricInterface {
  constructor(private readonly nearHelperService: NearHelperService) {}

  getType(): DaoStatsMetric {
    return DaoStatsMetric.NftsCount;
  }

  async getCurrentValue({
    contract,
  }: DaoContractMetricCurrentParams): Promise<number> {
    return (await this.nearHelperService.getLikelyNFTs(contract.contractId))
      .length;
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
