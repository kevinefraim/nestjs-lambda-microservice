import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import * as compression from 'compression';
import helmet from 'helmet';
import * as basicAuth from 'basic-auth';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // // Configure CORS
  // app.enableCors({
  //   origin: configService.get<string>('CORS_ORIGIN') || '*',
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  // });

  // Conditionally load production middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(compression());
    app.use(helmet());

    // Add Swagger basic auth protection in production
    const swaggerUser = configService.get<string>('SWAGGER_USER');
    const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

    app.use('/api/docs', (req, res, next) => {
      const user = basicAuth(req);
      if (!user || user.name !== swaggerUser || user.pass !== swaggerPassword) {
        res.set('WWW-Authenticate', 'Basic realm="Swagger"');
        res.status(401).send('Authentication required.');
        return;
      }
      next();
    });
  }

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Meetings Microservice')
    .setDescription('API for Meetings')
    .setVersion('1.0')
    .addServer('/')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Make validation constraints injectable
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  return app;
}
