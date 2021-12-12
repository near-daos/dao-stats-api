import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration, {
  CacheConfigService,
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/api-config';
import { ApiValidationSchema } from '@dao-stats/config/validation/api.schema';
import { HttpCacheModule } from '@dao-stats/cache';
import {
  Contract,
  Receipt,
  ReceiptAction,
  Transaction,
} from '@dao-stats/common';
import { RedisModule } from '@dao-stats/redis';

import { ContractInterceptor } from './interceptors/contract.interceptor';
import { ContractModule } from './contract/contract.module';
import { GeneralModule } from './general/general.module';
import { UsersModule } from './users/users.module';
import { GovernanceModule } from './governance/governance.module';
import { FlowModule } from './flow/flow.module';
import { TvlModule } from './tvl/tvl.module';
import { ApiDaoModule } from './dao/dao.module';

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
    ApiDaoModule,
    GeneralModule,
    UsersModule,
    GovernanceModule,
    FlowModule,
    TvlModule,
  ],
  providers: [ContractInterceptor],
})
export class AppModule {}
