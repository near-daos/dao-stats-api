const SnakeNamingStrategy =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('typeorm-naming-strategies').SnakeNamingStrategy;

module.exports = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['libs/common/src/entities/**/*.ts'],
  migrations: ['libs/common/src/migrations/**/*.ts'],
  subscribers: ['libs/common/src/subscribers/**/*.ts'],
  cli: {
    entitiesDir: 'libs/common/src/entities',
    migrationsDir: 'libs/common/src/migrations',
    subscribersDir: 'libs/common/src/subscribers',
  },
};
