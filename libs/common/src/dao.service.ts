import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Dao } from './entities';
import { ContractContextService } from 'apps/api/src/context/contract-context.service';
import { DaoDto } from './dto';

@Injectable()
export class DaoService extends ContractContextService {
  constructor(
    @InjectRepository(Dao)
    private readonly daoRepository: Repository<Dao>,
  ) {
    super();
  }

  // TODO: split aggregation/retrieval interactions due to ContractContext injection

  async find(): Promise<DaoDto[]> {
    const { contractId } = this.getContract();

    return this.daoRepository.find({ where: { contractId } });
  }

  async findById(dao: string): Promise<DaoDto> {
    const { contractId } = this.getContract();

    return this.daoRepository.findOne({ contractId, dao });
  }

  async create(dao: Partial<Dao>[]): Promise<Dao[]> {
    return this.daoRepository.save(dao);
  }

  async autocomplete(input: string): Promise<DaoDto[]> {
    const { contractId } = this.getContract();

    return this.daoRepository
      .createQueryBuilder('dao')
      .where('contract_id = :contractId', { contractId })
      .andWhere('dao LIKE :input', { input: `${input}%` })
      .getMany();
  }
}
