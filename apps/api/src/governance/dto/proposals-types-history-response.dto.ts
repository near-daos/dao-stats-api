import { ApiProperty } from '@nestjs/swagger';
import { ProposalsTypesHistory } from './proposals-types-history.dto';

export class ProposalsTypesHistoryResponse {
  @ApiProperty()
  metrics: ProposalsTypesHistory;
}
