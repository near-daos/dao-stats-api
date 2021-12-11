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

  async findById(dao: string): Promise<DaoResponse> {
    return this.daoRepository.findOne({ dao });
  }

  async create(dao: Partial<Dao>[]): Promise<Dao[]> {
    return this.daoRepository.save(dao);
  }
}
