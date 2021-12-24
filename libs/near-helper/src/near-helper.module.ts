import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { NearModule } from '@dao-stats/near';
import { NearHelperService } from './near-helper.service';

@Module({
  imports: [HttpModule, NearModule],
  providers: [NearHelperService],
  exports: [NearHelperService],
})
export class NearHelperModule {}
