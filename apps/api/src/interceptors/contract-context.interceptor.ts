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
  API_WHITELIST,
  DaoContractContext,
  DaoService,
} from '@dao-stats/common';

@Injectable()
export class ContractInterceptor implements NestInterceptor {
  constructor(
    private readonly contractService: ContractService,
    private readonly daoService: DaoService,
    @Inject(API_WHITELIST)
    private readonly apiWhitelist,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const { route, params } = context.switchToHttp().getRequest();
    const { contractId, dao } = params;

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

    if (dao) {
      const daoEntity = await this.daoService.findById(contractId, dao);
      if (!daoEntity) {
        return throwError(
          () =>
            new BadRequestException(
              `DAO '${dao}' is not found in '${contractId}' contract.`,
            ),
        );
      }
    }

    const ctx: DaoContractContext = RequestContext.get();
    ctx.contractId = contractId;
    ctx.contract = entity;
    ctx.dao = dao;

    return next.handle();
  }
}
