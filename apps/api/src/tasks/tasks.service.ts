import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { BATCH_SIZE, GRAY_DATA_IMPORT_JOB, GRAY_DATA_IMPORT_QUEUE, GrayDataRecord } from '@app/queue';

@Injectable()
export class TasksService {
  constructor(
    @InjectQueue(GRAY_DATA_IMPORT_QUEUE)
    private readonly importQueue: Queue,
  ) {}

  async enqueueGrayDataImport(records: GrayDataRecord[]): Promise<{ totalBatches: number; jobIds: string[] }> {
    const chunks: GrayDataRecord[][] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      chunks.push(records.slice(i, i + BATCH_SIZE));
    }

    const jobs = await this.importQueue.addBulk(
      chunks.map((batch, index) => ({
        name: GRAY_DATA_IMPORT_JOB,
        data: {
          batchNo: index + 1,
          totalBatches: chunks.length,
          records: batch,
        },
      })),
    );

    return {
      totalBatches: chunks.length,
      jobIds: jobs.map((job) => String(job.id)),
    };
  }
}
