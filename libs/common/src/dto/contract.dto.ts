import { ApiProperty } from '@nestjs/swagger';
import { CoinType } from '../types/coin-type';

export class ContractDto {
  @ApiProperty()
  contractId: string;

  @ApiProperty()
  contractName: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  conversionFactor: number;

  @ApiProperty()
  coin: CoinType;
}
