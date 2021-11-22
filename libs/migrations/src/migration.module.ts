import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import migrationScripts from './scripts';
import { ConfigModule } from '@nestjs/config';
import configuration, {
  TypeOrmConfigService,
} from '@dao-stats/config/aggregator-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [...migrationScripts],
})
export class MigrationModule {}
