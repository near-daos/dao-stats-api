import { TenantRequest } from '@dao-stats/common/dto/tenant-request.dto';
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

  async totals(tenantRequest: TenantRequest): Promise<GeneralTotalResponse> {
    const { contract } = tenantRequest;

    const { contractName } = await this.contractRepository.findOne({
      contractId: contract,
    });

    const transactions = await this.transactionService.findTransactions(
      contract,
    );

    const daos = transactions
      .filter((tx) => tx.receiverAccountId.includes(contractName))
      .map(({ receiverAccountId }) => receiverAccountId);

    console.log();

    return {
      dao: {
        count: [...new Set(daos)].length,
        growth: 0,
      },
    };
  }
}
