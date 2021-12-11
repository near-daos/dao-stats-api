import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProposalsTypesHistory {
  @ApiProperty({ type: [Metric] })
  governance: Metric[];

  @ApiProperty({ type: [Metric] })
  financial: Metric[];

  @ApiProperty({ type: [Metric] })
  bounties: Metric[];

  @ApiProperty({ type: [Metric] })
  members: Metric[];
}
