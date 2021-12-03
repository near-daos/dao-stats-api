import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import moment from 'moment';

export class MetricQuery {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  from: number;

  @ApiProperty({ required: false })
  @IsNumber()
  to: number = moment().valueOf();
}
