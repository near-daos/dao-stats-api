import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { Dao } from './entities';
import { DaoService } from './dao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dao])],
  providers: [DaoService],
  exports: [DaoService],
})
export class DaoModule {}
