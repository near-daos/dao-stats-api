import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Dao } from './entities';
import { DaoResponse } from './dto';

@Injectable()
export class DaoService {
  constructor(
    @InjectRepository(Dao)
    private readonly daoRepository: Repository<Dao>,
  ) {}

  async find(contractId: string): Promise<DaoResponse[]> {
    return this.daoRepository.find({ where: { contractId } });
  }

  async findById(contractId: string, dao: string): Promise<DaoResponse> {
    return this.daoRepository.findOne({ contractId, dao });
  }

  async create(dao: Partial<Dao>[]): Promise<Dao[]> {
    return this.daoRepository.save(dao);
  }

  async autocomplete(
    contractId: string,
    input: string,
  ): Promise<DaoResponse[]> {
    return this.daoRepository
      .createQueryBuilder('dao')
      .where('contract_id = :contractId', { contractId })
      .andWhere('dao LIKE :input', { input: `${input}%` })
      .getMany();
  }
}
