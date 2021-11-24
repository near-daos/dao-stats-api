import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregationService } from '.';
import configuration from './config/configuration';
import { TypeOrmConfigService } from './config/typeorm-config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      name: 'astro_indexer',
      useClass: TypeOrmConfigService,
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
