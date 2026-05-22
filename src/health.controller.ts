import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 9.69, description: 'Process uptime in seconds' })
  uptime!: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:50:30.130Z' })
  timestamp!: string;
}

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe', description: 'Public endpoint for health checks / load balancers.' })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
