import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule, ContractService } from '@dao-stats/common';

import { ContractController } from './contract.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    ContractModule,
  ],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ApiContractModule {}
