import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { Contract } from './entities';
import { ContractService } from './contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
