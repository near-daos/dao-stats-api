import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule, DaoModule } from '@dao-stats/common';

import { DaoController } from './dao.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    ContractModule,
    DaoModule,
  ],
  controllers: [DaoController],
})
export class ApiDaoModule {}
