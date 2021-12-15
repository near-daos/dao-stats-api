import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDaoStatsValueType1639584157798
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'alter table dao_stats alter column value type double precision using value::double precision',
    );
    await queryRunner.query(
      'alter table dao_stats_history alter column value type double precision using value::double precision',
    );
    await queryRunner.query(
      "update dao_stats set value = value / 1e12 where metric = 'BOUNTIES_VALUE_LOCKED' and value > 0",
    );
    await queryRunner.query(
      "update dao_stats_history set value = value / 1e12 where metric = 'BOUNTIES_VALUE_LOCKED' and value > 0",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "update dao_stats set value = value * 1e12 where metric = 'BOUNTIES_VALUE_LOCKED' and value > 0",
    );
    await queryRunner.query(
      "update dao_stats_history set value = value * 1e12 where metric = 'BOUNTIES_VALUE_LOCKED' and value > 0",
    );
    await queryRunner.query(
      'alter table dao_stats alter column value type bigint using value::bigint default 0',
    );
    await queryRunner.query(
      'alter table dao_stats_history alter column value type bigint using value::bigint default 0',
    );
  }
}
