import { Injectable, Logger } from '@nestjs/common';
import { DaoStatsMetric, convertFunds } from '@dao-stats/common';
import { NearHelperService } from '@dao-stats/near-helper';
import { SodakiService } from '@dao-stats/sodaki';
import { AstroService } from '../../astro.service';
import {
  DaoContractMetricCurrentParams,
  DaoContractMetricHistoryParams,
  DaoContractMetricHistoryResponse,
  DaoContractMetricInterface,
} from '../../interfaces';

@Injectable()
export class FtsValueLockedMetric implements DaoContractMetricInterface {
  private readonly logger = new Logger(FtsValueLockedMetric.name);

  constructor(
    private readonly astroService: AstroService,
    private readonly nearHelperService: NearHelperService,
    private readonly sodakiService: SodakiService,
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
    const nearPrice = await this.sodakiService.getNearPrice();
    const tokenBalances = await Promise.all(
      tokens.map(async (token) => {
        const fTokenContract = await this.astroService.getFTokenContract(token);
        const [metadata, balance, price] = await Promise.all([
          fTokenContract.getMetadata().catch((err) => {
            if (err.type === 'UntypedError') {
              this.logger.warn(
                `Unable to get FT metadata for contract ${
                  contract.contractId
                } and token ${token}: ${String(err)}`,
              );
            } else {
              throw err;
            }
          }),
          fTokenContract.getBalance(contract.contractId).catch((err) => {
            if (err.type === 'UntypedError') {
              this.logger.warn(
                `Unable to get FT balance for contract ${
                  contract.contractId
                } and token ${token}: ${String(err)}`,
              );
            } else {
              throw err;
            }
          }),
          this.sodakiService.getTokenPrice(token).catch((err) => {
            if (err.type === 'UntypedError') {
              this.logger.warn(
                `Unable to get token price for contract ${
                  contract.contractId
                } and token ${token}: ${String(err)}`,
              );
            } else {
              throw err;
            }
          }),
        ]);
        if (balance && metadata && price) {
          const tokenBalance = convertFunds(
            balance,
            metadata.decimals,
          ).toNumber();
          this.logger.debug(
            `Contract ${contract.contractId} has ${tokenBalance} ${
              metadata.symbol
            } tokens with price ${tokenBalance * price} USD`,
          );
          return (tokenBalance * price) / nearPrice;
        }
        return 0;
      }),
    );
    return tokenBalances.reduce((prev, cur) => prev + cur, 0);
  }

  async getHistoricalValues({}: DaoContractMetricHistoryParams): Promise<DaoContractMetricHistoryResponse> {
    // TODO: add implementation
    return Promise.reject('Not implemented');
  }
}
