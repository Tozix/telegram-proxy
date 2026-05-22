import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Minimal set of environment variables that MUST be present/sane for the
 * service to boot. Everything else has safe defaults in `configuration.ts`.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsNotEmpty()
  @IsString()
  PUBLIC_BASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  DB_HOST!: string;

  @IsNotEmpty()
  @IsString()
  DB_NAME!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters long' })
  JWT_SECRET!: string;

  @IsNotEmpty()
  @IsString()
  ADMIN_EMAIL!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'ADMIN_PASSWORD must be at least 8 characters long' })
  ADMIN_PASSWORD!: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .filter(Boolean)
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return config;
}
