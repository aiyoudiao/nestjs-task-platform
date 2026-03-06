import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TableStore from 'tablestore';

import { GrayDataRecord } from '@app/queue';

@Injectable()
export class TableStoreService {
  private readonly logger = new Logger(TableStoreService.name);
  private readonly client: any;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new TableStore.Client({
      endpoint: this.configService.getOrThrow<string>('TABLESTORE_ENDPOINT'),
      instancename: this.configService.getOrThrow<string>('TABLESTORE_INSTANCE_NAME'),
      accessKeyId: this.configService.getOrThrow<string>('TABLESTORE_ACCESS_KEY_ID'),
      accessKeySecret: this.configService.getOrThrow<string>('TABLESTORE_ACCESS_KEY_SECRET'),
    });
    this.tableName = this.configService.getOrThrow<string>('TABLESTORE_TABLE_NAME');
  }

  /**
   * Writes one batch (100 rows) into TableStore using BatchWriteRow.
   * Throws on partial failure so BullMQ can retry according to attempts/backoff.
   */
  async writeBatch(records: GrayDataRecord[]): Promise<void> {
    const request = {
      tables: [
        {
          tableName: this.tableName,
          rows: records.map((record) => ({
            type: 'PUT',
            primaryKey: [
              {
                id: record.id,
              },
            ],
            attributeColumns: Object.entries(record)
              .filter(([key]) => key !== 'id')
              .map(([key, value]) => ({
                [key]: value ?? '',
              })),
            condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
          })),
        },
      ],
    };

    const response = await this.client.batchWriteRow(request);
    const failedRows = response?.tableOfRows?.[0]?.rows?.filter((row: any) => row.isOk === false) ?? [];

    if (failedRows.length > 0) {
      this.logger.error(`BatchWriteRow partially failed, failed rows: ${failedRows.length}`);
      throw new Error(`TableStore partial failure: ${failedRows.length}/${records.length}`);
    }
  }
}
