import { ApiProperty } from '@nestjs/swagger';
import { PaginatedMetaDto } from '../../common/dto/paginated.dto';
import { BotResponseDto } from './bot-response.dto';

/** Страница списка ботов. */
export class PaginatedBotsDto extends PaginatedMetaDto {
  @ApiProperty({ type: [BotResponseDto], description: 'Боты на текущей странице' })
  items!: BotResponseDto[];
}
