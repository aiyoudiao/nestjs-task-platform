export interface GrayDataRecord {
  /**
   * Business unique ID used as primary key in TableStore.
   */
  id: string;
  /**
   * Arbitrary record payload.
   */
  [key: string]: unknown;
}

export interface GrayDataBatchJobData {
  batchNo: number;
  totalBatches: number;
  records: GrayDataRecord[];
}

export interface DeadLetterJobData {
  failedJobId: string;
  reason: string;
  payload: GrayDataBatchJobData;
}
