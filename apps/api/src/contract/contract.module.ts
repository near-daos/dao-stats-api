import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule } from '@dao-stats/common';

import { ContractController } from './contract.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    ContractModule,
  ],
  controllers: [ContractController],
})
export class ApiContractModule {}
