import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ContractContext } from '@dao-stats/common';
import { RequestContext } from '@medibloc/nestjs-request-context';

@Injectable()
export class ContractContextPipe implements PipeTransform {
  async transform(context: ContractContext, metadata: ArgumentMetadata) {
    return {
      ...context,
      ...RequestContext.get(),
    };
  }
}
