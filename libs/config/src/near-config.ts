import { registerAs } from '@nestjs/config';

export default registerAs('near', () => ({
  env: process.env.NEAR_ENV || 'development',
  credentials: process.env.NEAR_CREDENTIALS_DIR || '.near-credentials',
}));
