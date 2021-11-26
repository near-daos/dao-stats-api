import { CacheModule, Module } from '@nestjs/common';

import { GeneralController } from './general.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { TransactionModule } from 'libs/transaction/src';
import { GeneralService } from './general.service';
import { Contract } from '@dao-stats/common/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    TransactionModule,
  ],
  providers: [GeneralService],
  controllers: [GeneralController],
})
export class GeneralModule {}
