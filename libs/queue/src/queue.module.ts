import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { GRAY_DATA_IMPORT_DEAD_QUEUE, GRAY_DATA_IMPORT_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: GRAY_DATA_IMPORT_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
        limiter: {
          max: 50,
          duration: 1000,
        },
      },
      {
        name: GRAY_DATA_IMPORT_DEAD_QUEUE,
        defaultJobOptions: {
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
