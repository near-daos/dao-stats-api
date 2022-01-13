const SnakeNamingStrategy =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('typeorm-naming-strategies').SnakeNamingStrategy;

module.exports = {
  type: 'postgres',
  host: 'localhost',
  port: 5437,
  username: 'dao-stats',
  password: 'dao-stats',
  database: 'dao-stats',
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
