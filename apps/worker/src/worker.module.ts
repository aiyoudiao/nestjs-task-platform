import { Module } from '@nestjs/common';

import { AppConfigModule } from '@app/config';
import { QueueModule } from '@app/queue';
import { TableStoreModule } from '@app/tablestore';
import { GrayDataImportProcessor } from './processors/gray-data-import.processor';

@Module({
  imports: [AppConfigModule, QueueModule, TableStoreModule],
  providers: [GrayDataImportProcessor],
})
export class WorkerAppModule {}
