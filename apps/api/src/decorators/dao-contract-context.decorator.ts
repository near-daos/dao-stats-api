import { DAO_CONTRACT_CONTEXT } from '@dao-stats/common';
import { SetMetadata } from '@nestjs/common';

export const HasDaoContractContext = () => SetMetadata(DAO_CONTRACT_CONTEXT, true);
