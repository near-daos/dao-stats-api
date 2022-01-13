import { ApiProperty } from '@nestjs/swagger';
import moment from 'moment';

const METRIC_RANGE_FORMAT_DESCRIPTION =
  'Please refer to <a href="https://momentjs.com/docs/#/parsing/">MomentJS</a>' +
  ' docs for supported formats reference. E.g: ```12/01/2021 or 1638309600000.```';

export class MetricQuery {
  @ApiProperty({
    type: String,
    required: false,
    description: `Metric Range Start. ${METRIC_RANGE_FORMAT_DESCRIPTION}`,
  })
  from?: number | any;

  @ApiProperty({
    type: String,
    required: false,
    description: `Metric Range End. ${METRIC_RANGE_FORMAT_DESCRIPTION}`,
  })
  to?: number | any = moment().subtract(1, 'day').endOf('day').valueOf();
}
