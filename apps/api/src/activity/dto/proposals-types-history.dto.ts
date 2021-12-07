import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class ProposalsTypesHistory {
  @ApiProperty({ type: [Metric] })
  payout: Metric[];

  @ApiProperty({ type: [Metric] })
  councilMember: Metric[];

  @ApiProperty({ type: [Metric] })
  policyChange: Metric[];

  @ApiProperty({ type: [Metric] })
  expired: Metric[];
}
