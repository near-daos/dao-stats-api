import { INestApplication } from '@nestjs/common';
// import { RedisPropagatorService } from './websocket/redis-propagator/redis-propagator.service';
// import { SocketStateAdapter } from './websocket/socket-state/socket-state.adapter';

export const initAdapters = (app: INestApplication): INestApplication => {
  // const redisPropagatorService = app.get(RedisPropagatorService);

  // app.useWebSocketAdapter(
  //   new SocketStateAdapter(app, redisPropagatorService),
  // );

  return app;
};
