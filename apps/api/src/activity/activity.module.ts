import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

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
