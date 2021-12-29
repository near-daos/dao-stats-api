import os from 'os';
import path from 'path';
import { ConnectConfig } from 'near-api-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NearConfig = ConnectConfig & {
  explorerUrl: string;
  providerUrl: string;
};

@Injectable()
export class NearConfigService {
  constructor(private readonly configService: ConfigService) {}

  get env(): string {
    const { env } = this.configService.get('near');
    return env;
  }

  get tokenApiUrl(): string {
    const { tokenApiUrl } = this.configService.get('near');
    return tokenApiUrl;
  }

  get connectConfig(): NearConfig {
    const { env } = this.configService.get('near');

    switch (env) {
      case 'production':
      case 'mainnet':
        return {
          networkId: 'mainnet',
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.near.org',
          helperUrl: 'https://helper.mainnet.near.org',
          explorerUrl: 'https://explorer.mainnet.near.org',
          providerUrl: 'https://archival-rpc.mainnet.near.org',
        };
      case 'development':
      case 'testnet':
        return {
          networkId: 'testnet',
          nodeUrl: 'https://rpc.testnet.near.org',
          walletUrl: 'https://wallet.testnet.near.org',
          helperUrl: 'https://helper.testnet.near.org',
          explorerUrl: 'https://explorer.testnet.near.org',
          providerUrl: 'https://archival-rpc.testnet.near.org',
        };
      case 'betanet':
        return {
          networkId: 'betanet',
          nodeUrl: 'https://rpc.betanet.near.org',
          walletUrl: 'https://wallet.betanet.near.org',
          helperUrl: 'https://helper.betanet.near.org',
          explorerUrl: 'https://explorer.betanet.near.org',
          providerUrl: 'https://archival-rpc.betanet.near.org',
        };
      default:
        throw Error(`Invalid NEAR environment: ${env}.`);
    }
  }

  get credentialsDir(): string {
    const { credentials } = this.configService.get('near');

    return path.join(os.homedir(), credentials);
  }
}
