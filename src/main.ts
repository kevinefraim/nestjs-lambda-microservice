import { createApp } from './bootstrap';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  const apiUrl = await app.getUrl();
  logger.log(`App is running on ${apiUrl} 🚀`);
}

bootstrap().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
