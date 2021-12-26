import { Observable, throwError } from 'rxjs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { ContractService } from '../contract/contract.service';
import { RequestContext } from '@medibloc/nestjs-request-context';
import {
  ContractContext,
  CONTRACT_CONTEXT_FREE_API_LIST,
} from '@dao-stats/common';

@Injectable()
export class ContractContextInterceptor implements NestInterceptor {
  constructor(
    readonly contractService: ContractService,
    @Inject(CONTRACT_CONTEXT_FREE_API_LIST)
    readonly apiWhitelist,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const { route, params } = context.switchToHttp().getRequest();
    const { contractId } = params;

    if (this.apiWhitelist.includes(route.path)) {
      return next.handle();
    }

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
