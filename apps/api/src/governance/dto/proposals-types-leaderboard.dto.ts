import { ApiProperty } from '@nestjs/swagger';
import { ProposalsTypes } from './proposals-types.dto';

export class ProposalsTypesLeaderboard {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  proposalsByType: ProposalsTypes;
}
