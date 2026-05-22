import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { DeliveryLogResponseDto } from './dto/delivery-log-response.dto';
import { DeliveryLogsService } from './delivery-logs.service';

@ApiTags('bots')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Missing or invalid bearer token' })
@UseGuards(JwtAuthGuard)
@Controller('api/bots')
export class DeliveryLogsController {
  constructor(private readonly logs: DeliveryLogsService) {}

  @Get(':id/logs')
  @ApiOperation({
    summary: 'Webhook delivery logs',
    description: 'Recent forwarding attempts (Telegram → proxy → backend) for this bot, newest first.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max rows (1–500, default 100)' })
  @ApiOkResponse({ type: [DeliveryLogResponseDto] })
  list(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ): Promise<DeliveryLogResponseDto[]> {
    return this.logs.findByBot(id, limit);
  }
}
