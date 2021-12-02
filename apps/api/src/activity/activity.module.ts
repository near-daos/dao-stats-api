import { CacheModule, Module } from '@nestjs/common';

import { ActivityController } from './activity.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { TransactionModule } from 'libs/transaction/src';
import { ActivityService } from './activity.service';
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
  providers: [ActivityService],
  controllers: [ActivityController],
})
export class ActivityModule {}
