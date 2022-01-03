import { ApiProperty } from '@nestjs/swagger';

export class DaoDto {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  metadata?: Record<string, any> | null;
}
