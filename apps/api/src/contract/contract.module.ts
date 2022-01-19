import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule, ContractService, Contract } from '@dao-stats/common';

import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    ContractModule,
  ],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ApiContractModule {}
