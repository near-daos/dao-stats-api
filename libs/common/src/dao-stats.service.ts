import { Connection, InsertResult, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import { DAOStats } from './entities';

@Injectable()
export class DAOStatsService {
  constructor(
    @InjectRepository(DAOStats)
    private readonly repository: Repository<DAOStats>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async createOrUpdate(data: DAOStats): Promise<InsertResult> {
    return await this.connection
      .createQueryBuilder()
      .insert()
      .into(DAOStats)
      .values(data)
      .orUpdate({
        conflict_target: ['contract_id', 'dao', 'metric'],
        overwrite: ['value'],
      })
      .execute();
  }
}
