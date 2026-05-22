import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 9.69, description: 'Аптайм процесса в секундах' })
  uptime!: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-22T07:50:30.130Z' })
  timestamp!: string;
}

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Проба живости', description: 'Публичный эндпоинт для health-check / балансировщиков.' })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
