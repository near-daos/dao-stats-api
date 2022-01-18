import { Connection } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Migration } from '..';

@Injectable()
export class DaoStatsHistoryUpdateChangeMigration implements Migration {
  private readonly logger = new Logger(
    DaoStatsHistoryUpdateChangeMigration.name,
  );

  constructor(
    @InjectConnection()
    private connection: Connection,
  ) {}

  public async migrate(): Promise<void> {
    const [, rowsAffected] = await this.connection.query(`
        UPDATE "dao_stats_history"
        SET "change"     = "data"."new_change",
            "updated_at" = now()
        FROM (
            SELECT "date",
                   "contract_id",
                   "metric",
                   "dao",
                   coalesce("total" - lag("total") OVER (PARTITION BY "contract_id", "metric", "dao" ORDER BY "date"),
                            "total") as "new_change"
            FROM "dao_stats_history"
        ) AS "data"
        WHERE "dao_stats_history"."date" = "data"."date"
          AND "dao_stats_history"."contract_id" = "data"."contract_id"
          AND "dao_stats_history"."metric" = "data"."metric"
          AND "dao_stats_history"."dao" = "data"."dao"
    `);

    this.logger.log(`Affected rows: ${rowsAffected}`);
  }
}
