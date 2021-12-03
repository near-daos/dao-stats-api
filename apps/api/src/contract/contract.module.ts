import { CacheModule, Module } from '@nestjs/common';

import { ContractController } from './contract.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractService } from './contract.service';
import { Contract } from '@dao-stats/common/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
  ],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule {}
