import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pinoHttp from 'pino-http';

import { ApiAppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiAppModule);

  app.use(
    pinoHttp({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
