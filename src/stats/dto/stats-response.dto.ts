import { ApiProperty } from '@nestjs/swagger';

export class UsersStatsDto {
  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 30, description: 'С подтверждённым email' }) verified!: number;
  @ApiProperty({ example: 2 }) admins!: number;
}

export class BotsStatsDto {
  @ApiProperty({ example: 17 }) total!: number;
  @ApiProperty({ example: 15 }) active!: number;
  @ApiProperty({ example: 1, description: 'С ошибкой установки вебхука' }) withErrors!: number;
}

export class DeliveriesStatsDto {
  @ApiProperty({ example: 12000 }) total!: number;
  @ApiProperty({ example: 11800 }) success!: number;
  @ApiProperty({ example: 200 }) failed!: number;
  @ApiProperty({ example: 540, description: 'За последние 24 часа' }) last24h!: number;
}

export class DeliverySeriesPointDto {
  @ApiProperty({ example: '2026-05-22' }) date!: string;
  @ApiProperty({ example: 540 }) total!: number;
  @ApiProperty({ example: 530 }) success!: number;
  @ApiProperty({ example: 10 }) failed!: number;
}

export class TopBotDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'My Support Bot' }) name!: string;
  @ApiProperty({ example: 3400 }) deliveries!: number;
}

export class StatsResponseDto {
  @ApiProperty({ type: UsersStatsDto }) users!: UsersStatsDto;
  @ApiProperty({ type: BotsStatsDto }) bots!: BotsStatsDto;
  @ApiProperty({ type: DeliveriesStatsDto }) deliveries!: DeliveriesStatsDto;
  @ApiProperty({ type: [DeliverySeriesPointDto], description: 'Доставки по дням за последние 14 дней' })
  series!: DeliverySeriesPointDto[];
  @ApiProperty({ type: [TopBotDto], description: 'Топ ботов по числу доставок' })
  topBots!: TopBotDto[];
}
