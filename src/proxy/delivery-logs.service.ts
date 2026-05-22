import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryLogResponseDto } from './dto/delivery-log-response.dto';

@Injectable()
export class DeliveryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBot(botId: string, limit = 100): Promise<DeliveryLogResponseDto[]> {
    const rows = await this.prisma.deliveryLog.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows.map((row) => DeliveryLogResponseDto.from(row));
  }
}
