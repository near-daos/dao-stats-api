import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
