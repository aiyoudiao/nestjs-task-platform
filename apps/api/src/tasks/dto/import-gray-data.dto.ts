import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

import { GrayDataRecord } from '@app/queue';

export class ImportGrayDataDto {
  @IsArray()
  @ArrayMinSize(1000)
  @ArrayMaxSize(50000)
  records!: GrayDataRecord[];
}
