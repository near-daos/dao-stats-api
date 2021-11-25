import { Transaction } from '@dao-stats/common/entities';
import { ReceiptAction } from '@dao-stats/common/entities/receipt-action.entity';
import { Receipt } from '@dao-stats/common/entities/receipt.entity';
import { registerAs } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export default registerAs('db_default', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  entities: [Transaction, Receipt, ReceiptAction],
  synchronize: true,
  migrationsTableName: 'migration_table',
  migrations: ['migration/*.js'],
  cli: {
    migrationsDir: 'migration',
  },
  namingStrategy: new SnakeNamingStrategy(),
}));
