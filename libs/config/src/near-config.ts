import { registerAs } from '@nestjs/config';

export type NEAR_ENV =
  | 'production'
  | 'development'
  | 'local'
  | 'test'
  | 'mainnet'
  | 'betanet'
  | 'testnet'
  | 'ci'
  | 'ci-betanet';

export type NEAR_CONFIG = {
  env: NEAR_ENV;
};

export type NearConfig = {
  walletFormat?: string;
  networkId: string;
  nodeUrl: string;
  masterAccount?: string;
  walletUrl?: string;
  helperUrl?: string;
  explorerUrl?: string;
  providerUrl?: string;
  keyPath?: string;
};

export const getNearConfig = (nearConfig: NEAR_CONFIG): NearConfig => {
  const { env } = nearConfig;

  switch (env) {
    case 'production':
    case 'mainnet':
      return {
        walletFormat: '.near',
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
        walletFormat: '.testnet',
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
        providerUrl: 'https://archival-rpc.testnet.near.org',
      };
    case 'betanet':
      return {
        walletFormat: '.betanet',
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org',
        explorerUrl: 'https://explorer.betanet.near.org',
        providerUrl: 'https://archival-rpc.betanet.near.org',
      };
    default:
      throw Error(
        `Unconfigured environment '${env}'. Can be configured in src/config.ts.`,
      );
  }
};

export default registerAs('near', () =>
  getNearConfig({
    env: (process.env.NEAR_ENV as NEAR_ENV) || 'development',
    contractName: process.env.NEAR_CONTRACT_NAME,
    tokenFactoryContractName: process.env.NEAR_TOKEN_FACTORY_CONTRACT_NAME,
    bridgeTokenFactoryContractName:
      process.env.NEAR_BRIDGE_TOKEN_FACTORY_CONTRACT_NAME,
    pollingInterval: process.env.AGGREGATOR_POLLING_INTERVAL,
    daoPollingInterval: process.env.DAO_POLLING_INTERVAL,
  } as NEAR_CONFIG),
);
