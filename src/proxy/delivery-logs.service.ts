import { Injectable } from '@nestjs/common';
import { buildMeta } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedDeliveryLogsDto } from './dto/paginated-delivery-logs.dto';
import { DeliveryLogResponseDto } from './dto/delivery-log-response.dto';

@Injectable()
export class DeliveryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBot(botId: string, limit: number, offset: number): Promise<PaginatedDeliveryLogsDto> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.deliveryLog.findMany({
        where: { botId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.deliveryLog.count({ where: { botId } }),
    ]);
    return { ...buildMeta(total, limit, offset), items: rows.map((row) => DeliveryLogResponseDto.from(row)) };
  }
}
