import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate,
    }),
  ],
})
export class AppConfigModule {}
