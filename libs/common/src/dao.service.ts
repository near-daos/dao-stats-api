import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Dao } from './entities';
import { DaoResponse } from './dto';
import { ContractContextService } from 'apps/api/src/context/contract-context.service';

@Injectable()
export class DaoService extends ContractContextService {
  constructor(
    @InjectRepository(Dao)
    private readonly daoRepository: Repository<Dao>,
  ) {
    super();
  }

  // TODO: split aggregation/retrieval interactions due to ContractContext injection

  async find(): Promise<DaoResponse[]> {
    const { contractId } = this.getContext()?.contract;

    return this.daoRepository.find({ where: { contractId } });
  }

  // TODO
  async findById(dao: string): Promise<DaoResponse> {
    const { contractId } = this.getContext()?.contract;

    return this.daoRepository.findOne({ contractId, dao });
  }

  async create(dao: Partial<Dao>[]): Promise<Dao[]> {
    return this.daoRepository.save(dao);
  }

  async autocomplete(input: string): Promise<DaoResponse[]> {
    const { contractId } = this.getContext()?.contract;

    return this.daoRepository
      .createQueryBuilder('dao')
      .where('contract_id = :contractId', { contractId })
      .andWhere('dao LIKE :input', { input: `${input}%` })
      .getMany();
  }
}
