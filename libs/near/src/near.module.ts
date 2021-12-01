import { Module } from '@nestjs/common';

import { NearConfigService } from './near-config.service';
import { nearProvider, nearRPCProvider } from './near.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [NearConfigService, nearProvider, nearRPCProvider],
  exports: [NearConfigService, nearProvider, nearRPCProvider],
})
export class NearModule {}
