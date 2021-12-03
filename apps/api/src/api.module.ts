import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration, {
  CacheConfigService,
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/api-config';
import { HttpCacheModule } from '@dao-stats/cache';

import { RedisModule } from 'libs/redis/src/redis.module';
import { GeneralModule } from './general/general.module';
import { ContractInterceptor } from './interceptors/contract.interceptor';
import { ApiValidationSchema } from '@dao-stats/config/validation/api.schema';
import {
  Contract,
  Receipt,
  ReceiptAction,
  Transaction,
} from '@dao-stats/common';

import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';
import { FlowModule } from './flow/flow.module';
import { ContractModule } from './contract/contract.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      validate: (config) => validate(ApiValidationSchema, config),
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Contract, Receipt, ReceiptAction, Transaction]),
    HttpCacheModule,
    RedisModule,
    ContractModule,
    GeneralModule,
    UsersModule,
    ActivityModule,
    FlowModule,
  ],
  providers: [ContractInterceptor],
})
export class AppModule {}
