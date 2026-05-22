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
  DATABASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(16, { message: 'JWT_SECRET должен быть не короче 16 символов' })
  JWT_SECRET!: string;

  @IsNotEmpty()
  @IsString()
  ADMIN_EMAIL!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'ADMIN_PASSWORD должен быть не короче 8 символов' })
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
