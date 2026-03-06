import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsNotEmpty()
  TABLESTORE_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty()
  TABLESTORE_INSTANCE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  TABLESTORE_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  TABLESTORE_ACCESS_KEY_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  TABLESTORE_TABLE_NAME!: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
