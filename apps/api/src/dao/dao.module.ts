import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Dao, DaoService } from '@dao-stats/common';

import { DaoController } from './dao.controller';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Dao]),
    ContractModule,
  ],
  providers: [DaoService],
  controllers: [DaoController],
  exports: [DaoService],
})
export class ApiDaoModule {}
