import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getConnection,
} from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NEAR_INDEXER_DB_CONNECTION } from './constants';
import { Receipt, ReceiptAction, Transaction } from './entities';

export const NearIndexerDBProvider: Provider = {
  provide: NEAR_INDEXER_DB_CONNECTION,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<Connection> => {
    const { host, port, username, password, database } =
      configService.get('indexer.db');

    const connection: ConnectionOptions = {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      name: NEAR_INDEXER_DB_CONNECTION,
      entities: [Transaction, Receipt, ReceiptAction],
      synchronize: false,
      namingStrategy: new SnakeNamingStrategy(),
    };

    try {
      getConnection(connection.name);
    } catch (error) {
      return await createConnection(connection);
    }
  },
};
