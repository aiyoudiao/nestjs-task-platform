import { Module } from '@nestjs/common';

import { AppConfigModule } from '@app/config';
import { QueueModule } from '@app/queue';
import { TableStoreModule } from '@app/tablestore';
import { TasksModule } from './tasks/tasks.module';
import { QueueUiModule } from './queue-ui/queue-ui.module';

@Module({
  imports: [AppConfigModule, QueueModule, TableStoreModule, TasksModule, QueueUiModule],
})
export class ApiAppModule {}
