import { Observable, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RequestContext } from '@medibloc/nestjs-request-context';

import { ContractContext, NO_CONTRACT_CONTEXT } from '@dao-stats/common';
import { ContractService } from '../contract/contract.service';

@Injectable()
export class ContractContextInterceptor implements NestInterceptor {
  constructor(
    readonly contractService: ContractService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (
      this.reflector.get<boolean>(NO_CONTRACT_CONTEXT, context.getHandler())
    ) {
      return next.handle();
    }

    const { params } = context.switchToHttp().getRequest();
    const { contractId } = params;

    if (!contractId) {
      return throwError(
        () => new BadRequestException('Tenant(contract) name is missing!'),
      );
    }

    const entity = await this.contractService.findById(contractId);

    if (!entity) {
      return throwError(
        () => new BadRequestException(`Invalid contract name: ${contractId}`),
      );
    }

    const ctx: ContractContext = RequestContext.get();
    ctx.contractId = contractId;
    ctx.contract = entity;

    return next.handle();
  }
}
