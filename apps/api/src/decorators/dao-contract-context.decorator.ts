import { SetMetadata } from '@nestjs/common';
import { DAO_CONTRACT_CONTEXT } from '@dao-stats/common';

export const HasDaoContractContext = () =>
  SetMetadata(DAO_CONTRACT_CONTEXT, true);
