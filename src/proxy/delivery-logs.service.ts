import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryLog } from './delivery-log.entity';
import { DeliveryLogResponseDto } from './dto/delivery-log-response.dto';

@Injectable()
export class DeliveryLogsService {
  constructor(@InjectRepository(DeliveryLog) private readonly logs: Repository<DeliveryLog>) {}

  async findByBot(botId: string, limit = 100): Promise<DeliveryLogResponseDto[]> {
    const rows = await this.logs.find({
      where: { botId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows.map((row) => DeliveryLogResponseDto.from(row));
  }
}
