import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { NearService } from './near.service';
import { NearConfigService } from './near-config.service';
import { nearProvider, nearRPCProvider } from './near.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [NearService, NearConfigService, nearProvider, nearRPCProvider],
  exports: [NearService, NearConfigService, nearProvider, nearRPCProvider],
})
export class NearModule {}
