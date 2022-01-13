import { NO_CONTRACT_CONTEXT } from '@dao-stats/common';
import { SetMetadata } from '@nestjs/common';

export const NoContractContext = () => SetMetadata(NO_CONTRACT_CONTEXT, true);
