import { TenantContext } from '@dao-stats/common/dto/tenant-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { GeneralTotalResponse } from './dto/general-total.dto';

@Injectable()
export class GeneralService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(tenantContext: TenantContext): Promise<GeneralTotalResponse> {
    const { contract } = tenantContext;

    const daoCount = await this.transactionService.getContractTotalCount(
      contract,
    );

    const today = new Date();
    const weekAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7,
    );
    const weekAgoDaoCount = await this.transactionService.getContractTotalCount(
      contract,
      weekAgo.getTime() * 1000 * 1000,
    );

    return {
      dao: {
        count: daoCount,
        growth: Math.ceil(
          (weekAgoDaoCount / (daoCount - weekAgoDaoCount)) * 100,
        ),
      },
    };
  }
}
