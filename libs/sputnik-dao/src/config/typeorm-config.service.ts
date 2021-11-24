import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createTypeOrmOptions(name: string): TypeOrmModuleOptions {
    const { host, port, username, password, database } =
      this.configService.get('indexer.db');

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: [],
      synchronize: true,
      keepConnectionAlive: true,
    };
  }
}
