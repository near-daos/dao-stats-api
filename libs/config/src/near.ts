import os from 'os';
import path from 'path';
import { connect, providers } from 'near-api-js';
import { ConfigService } from '@nestjs/config';
import { UnencryptedFileSystemKeyStore } from 'near-api-js/lib/key_stores';
import { NEAR_PROVIDER, NEAR_RPC_PROVIDER } from '@dao-stats/common/constants';

export const nearProvider = {
  provide: NEAR_PROVIDER,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const config = configService.get('near');

    const keyDir = path.join(
      os.homedir(),
      process.env.NEAR_CREDENTIALS_DIR || '.near-credentials',
    );

    return await connect({
      deps: {
        keyStore: new UnencryptedFileSystemKeyStore(keyDir),
      },
      ...config,
    });
  },
};

export const nearRPCProvider = {
  provide: NEAR_RPC_PROVIDER,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const { providerUrl } = configService.get('near');

    return new providers.JsonRpcProvider(providerUrl);
  },
};
