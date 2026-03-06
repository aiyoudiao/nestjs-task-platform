import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import {
  GRAY_DATA_IMPORT_DEAD_JOB,
  GRAY_DATA_IMPORT_DEAD_QUEUE,
  GRAY_DATA_IMPORT_JOB,
  GRAY_DATA_IMPORT_QUEUE,
  GrayDataBatchJobData,
} from '@app/queue';
import { TableStoreService } from '@app/tablestore';

@Injectable()
@Processor(GRAY_DATA_IMPORT_QUEUE, { concurrency: 3 })
export class GrayDataImportProcessor extends WorkerHost {
  private readonly logger = new Logger(GrayDataImportProcessor.name);

  constructor(
    private readonly tableStoreService: TableStoreService,
    @InjectQueue(GRAY_DATA_IMPORT_DEAD_QUEUE)
    private readonly deadQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<GrayDataBatchJobData>): Promise<void> {
    if (job.name !== GRAY_DATA_IMPORT_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    this.logger.log(`Processing batch ${job.data.batchNo}/${job.data.totalBatches}, size=${job.data.records.length}`);
    await this.tableStoreService.writeBatch(job.data.records);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<GrayDataBatchJobData>): void {
    this.logger.log(`Completed job ${job.id} for batch ${job.data.batchNo}/${job.data.totalBatches}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<GrayDataBatchJobData> | undefined, error: Error): Promise<void> {
    if (!job) {
      this.logger.error(`Job failed before hydration: ${error.message}`);
      return;
    }

    const reachedMaxAttempts = job.attemptsMade >= (job.opts.attempts ?? 1);
    this.logger.error(
      `Job ${job.id} failed, attempts=${job.attemptsMade}/${job.opts.attempts ?? 1}, reason=${error.message}`,
    );

    if (reachedMaxAttempts) {
      await this.deadQueue.add(GRAY_DATA_IMPORT_DEAD_JOB, {
        failedJobId: String(job.id),
        reason: error.message,
        payload: job.data,
      });
      this.logger.error(`Job ${job.id} moved to dead letter queue`);
    }
  }
}
