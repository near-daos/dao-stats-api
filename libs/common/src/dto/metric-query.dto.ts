import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import moment from 'moment';

export class MetricQuery {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  from?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  to: number = moment().valueOf();
}
