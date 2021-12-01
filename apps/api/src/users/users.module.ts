import { CacheModule, Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { TransactionModule } from 'libs/transaction/src';
import { UsersService } from './users.service';
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
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
