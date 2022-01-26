import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { CoinGeckoService } from './coin-gecko.service';
import { SodakiService } from './sodaki.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [SodakiService, CoinGeckoService],
  exports: [SodakiService, CoinGeckoService],
})
export class ExchangeModule {}
