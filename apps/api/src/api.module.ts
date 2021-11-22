import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiValidationSchema } from '@dao-stats/config/validation/api.schema';
import configuration, {
  TypeOrmConfigService,
  validate,
} from '@dao-stats/config/api-config';
import { CacheConfigService } from '@dao-stats/config/api-config';
import { HttpCacheModule } from '@dao-stats/cache';

import { AppController } from './api.controller';
import { RedisModule } from 'libs/redis/redis.module';

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
    HttpCacheModule,
    RedisModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
