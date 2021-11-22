import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum Environment {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class BaseValidationSchema {
  @IsEnum(Environment)
  @IsString()
  NODE_ENV: Environment;

  @IsString()
  @IsNotEmpty()
  LOG_LEVELS: string;
}
