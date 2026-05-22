import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBotDto } from './create-bot.dto';

export class UpdateBotDto extends PartialType(
  PickType(CreateBotDto, ['name', 'token', 'targetWebhookUrl', 'allowedUpdates'] as const),
) {
  @ApiPropertyOptional({ description: 'Enable/disable forwarding for this bot.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
