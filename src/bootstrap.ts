import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as morgan from 'morgan';
import * as chalk from 'chalk';
import * as basicAuth from 'basic-auth';
import * as compression from 'compression';
import helmet from 'helmet';
import { useContainer } from 'class-validator';

export async function createApp() {
  // Always use FastifyAdapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);

  // Middleware for logging requests
  app.use(
    morgan(
      (tokens, req, res) =>
        chalk.cyanBright(tokens.method(req, res)) +
        ' ' +
        chalk.redBright(tokens.url(req, res)) +
        ' ' +
        chalk.cyan(tokens.status(req, res)) +
        ' ' +
        chalk.yellow(tokens['response-time'](req, res)),
      { skip: (req) => req.method === 'OPTIONS' },
    ),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Enable compression and security headers
  app.use(compression());
  app.use(helmet());

  // Swagger setup with Basic Auth for production
  const swaggerUser = configService.get<string>('SWAGGER_USER');
  const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

  if (process.env.NODE_ENV === 'production') {
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

  // Global error handling and Prisma exception filter
  const httpAdapter = app.getHttpAdapter();
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  return app;
}
