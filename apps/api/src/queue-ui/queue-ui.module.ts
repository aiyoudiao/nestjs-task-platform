import { Module, OnModuleInit } from '@nestjs/common';

@Module({})
export class QueueUiModule implements OnModuleInit {
  onModuleInit(): void {
    // Bull Board integration is temporarily disabled because @bull-board/api
    // has been removed from dependencies per current requirement.
    //
    // Previous implementation (now commented out) mounted queue UI at /admin/queues.
    // Re-enable by restoring @bull-board/api and related wiring.
  }
}
