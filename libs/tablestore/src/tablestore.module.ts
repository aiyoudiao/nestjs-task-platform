import { Global, Module } from '@nestjs/common';

import { TableStoreService } from './tablestore.service';

@Global()
@Module({
  providers: [TableStoreService],
  exports: [TableStoreService],
})
export class TableStoreModule {}
