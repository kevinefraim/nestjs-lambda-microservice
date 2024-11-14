import { createApp } from './bootstrap';
import { configure as serverlessExpress } from '@vendia/serverless-express';

let cachedServer;

export const handler = async (event, context) => {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = serverlessExpress({
      app: app.getHttpAdapter().getInstance(),
    });
  }
  return cachedServer(event, context);
};
