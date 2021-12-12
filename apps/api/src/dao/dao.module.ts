import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Dao, DaoService } from '@dao-stats/common';

import { DaoController } from './dao.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Dao]),
  ],
  providers: [DaoService],
  controllers: [DaoController],
  exports: [DaoService],
})
export class ApiDaoModule {}