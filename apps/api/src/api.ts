import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  Logger,
  LogLevel,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './api.module';
import { API_WHITELIST } from '@dao-stats/common';

export default class Api {
  private readonly logger = new Logger(Api.name);

  async bootstrap(): Promise<void> {
    const logger = [...(process.env.LOG_LEVELS.split(',') as LogLevel[])];
    const app = await NestFactory.create(AppModule, {
      logger,
    });
    app.enableCors();
    app.setGlobalPrefix('/api/v1/:contractId', {
      exclude: app.get(API_WHITELIST),
    });

    if (process.env.NODE_ENV === 'development') {
      (app as any).httpAdapter.instance.set('json spaces', 2);
    }

    const config = new DocumentBuilder()
      .setTitle('DAO Stats API')
      .setDescription('DAO Stats API Backend Server')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        disableErrorMessages: false,
        validationError: { target: false },
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    const configService: ConfigService = app.get(ConfigService);

    const port = configService.get<number>('api.port');

    await app.listen(port, () =>
      this.logger.log('API Service is listening...'),
    );
  }
}
