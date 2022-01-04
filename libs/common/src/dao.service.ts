import { DeleteResult, In, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Dao } from './entities';
import { DaoDto } from './dto';

@Injectable()
export class DaoService {
  constructor(
    @InjectRepository(Dao)
    private readonly daoRepository: Repository<Dao>,
  ) {}

  async find(contractId: string): Promise<DaoDto[]> {
    return this.daoRepository.find({ where: { contractId } });
  }

  async findById(contractId: string, dao: string): Promise<DaoDto> {
    return this.daoRepository.findOne({ contractId, dao });
  }

  async create(dao: Partial<Dao>): Promise<Dao> {
    return this.daoRepository.save(dao);
  }

  async purgeInactive(
    contractId: string,
    activeDaoIds: string[],
  ): Promise<DeleteResult> {
    return this.daoRepository.delete({
      contractId,
      dao: Not(In(activeDaoIds)),
    });
  }

  async autocomplete(contractId: string, input: string): Promise<DaoDto[]> {
    return this.daoRepository
      .createQueryBuilder('dao')
      .where('contract_id = :contractId', { contractId })
      .andWhere('dao LIKE :input', { input: `${input}%` })
      .getMany();
  }
}
