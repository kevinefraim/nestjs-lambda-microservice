import { createApp } from './bootstrap';
import { awsLambdaFastify } from '@fastify/aws-lambda';

let cachedServer;

export const handler = async (event, context) => {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = awsLambdaFastify(app.getHttpAdapter().getInstance());
  }
  return cachedServer(event, context);
};
