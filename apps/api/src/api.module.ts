import {
  CacheModule,
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RequestContextModule } from '@medibloc/nestjs-request-context';

import configuration, {
  CacheConfigService,
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/api-config';
import { ApiValidationSchema } from '@dao-stats/config/validation/api.schema';
import { HttpCacheModule } from '@dao-stats/cache';
import {
  CONTRACT_CONTEXT_FREE_API_LIST,
  Contract,
  ContractContext,
  Receipt,
  ReceiptAction,
  Transaction,
} from '@dao-stats/common';
import { RedisModule } from '@dao-stats/redis';

import { ContractContextInterceptor } from './interceptors/contract-context.interceptor';
import { ContractModule } from './contract/contract.module';
import { GeneralModule } from './general/general.module';
import { UsersModule } from './users/users.module';
import { GovernanceModule } from './governance/governance.module';
import { FlowModule } from './flow/flow.module';
import { TvlModule } from './tvl/tvl.module';
import { ApiDaoModule } from './dao/dao.module';
import { TokensModule } from './tokens/tokens.module';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpCacheInterceptor } from './interceptors';
import { DaoContractContextInterceptor } from './interceptors/dao-contract-context.interceptor';

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
    RequestContextModule.forRoot({
      contextClass: ContractContext,
      isGlobal: true,
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
    TokensModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ContractContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DaoContractContextInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          disableErrorMessages: false,
          validationError: { target: false },
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: CONTRACT_CONTEXT_FREE_API_LIST,
      useValue: ['/api/v1/contracts'],
    },
  ],
})
export class AppModule {}
