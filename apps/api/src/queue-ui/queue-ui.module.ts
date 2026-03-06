import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { GRAY_DATA_IMPORT_DEAD_QUEUE, GRAY_DATA_IMPORT_QUEUE } from '@app/queue';

@Module({})
export class QueueUiModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectQueue(GRAY_DATA_IMPORT_QUEUE) private readonly importQueue: Queue,
    @InjectQueue(GRAY_DATA_IMPORT_DEAD_QUEUE) private readonly deadQueue: Queue,
  ) {}

  onModuleInit(): void {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(this.importQueue), new BullMQAdapter(this.deadQueue)],
      serverAdapter,
    });

    const instance = this.httpAdapterHost.httpAdapter.getInstance();
    instance.use('/admin/queues', serverAdapter.getRouter());
  }
}
