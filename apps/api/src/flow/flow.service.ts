import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { FlowTotalResponse } from './dto/flow-total.dto';

@Injectable()
export class FlowService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<FlowTotalResponse> {
    const txCount = await this.transactionService.getTransactionTotalCount(
      context,
    );

    const today = new Date();
    const dayAgo = daysFromDate(today, -1);
    const dayAgoTxCount =
      await this.transactionService.getTransactionTotalCount(
        context,
        null,
        millisToNanos(dayAgo.getTime()),
      );

    return {
      transactions: {
        count: txCount,
        growth: Math.floor(((txCount - dayAgoTxCount) / dayAgoTxCount) * 100),
      },
    };
  }
}
