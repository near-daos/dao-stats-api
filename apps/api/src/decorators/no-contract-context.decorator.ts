import { SetMetadata } from '@nestjs/common';
import { NO_CONTRACT_CONTEXT } from '@dao-stats/common';

export const NoContractContext = () => SetMetadata(NO_CONTRACT_CONTEXT, true);
