import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ImportGrayDataDto } from './dto/import-gray-data.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * API only enqueues jobs and returns quickly.
   */
  @Post('import-gray-data')
  @HttpCode(HttpStatus.ACCEPTED)
  async importGrayData(@Body() body: ImportGrayDataDto): Promise<Record<string, unknown>> {
    const result = await this.tasksService.enqueueGrayDataImport(body.records);
    return {
      message: 'Gray data import accepted',
      ...result,
    };
  }
}
