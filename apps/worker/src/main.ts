import { NestFactory } from '@nestjs/core';

import { WorkerAppModule } from './worker.module';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(WorkerAppModule);
}

void bootstrap();
