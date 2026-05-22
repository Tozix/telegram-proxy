import { Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverySeriesPointDto, StatsResponseDto } from './dto/stats-response.dto';

const DAYS = 14;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<StatsResponseDto> {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersVerified,
      admins,
      botsTotal,
      botsActive,
      botsErrored,
      deliveriesTotal,
      deliveriesSuccess,
      deliveries24h,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      this.prisma.user.count({ where: { role: UserRole.admin } }),
      this.prisma.bot.count(),
      this.prisma.bot.count({ where: { isActive: true } }),
      this.prisma.bot.count({ where: { webhookError: { not: null } } }),
      this.prisma.deliveryLog.count(),
      this.prisma.deliveryLog.count({ where: { success: true } }),
      this.prisma.deliveryLog.count({ where: { createdAt: { gte: since24h } } }),
    ]);

    const rawSeries = await this.prisma.$queryRaw<{ day: string; total: number; success: number }[]>`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
             count(*)::int AS total,
             count(*) FILTER (WHERE success)::int AS success
      FROM delivery_logs
      WHERE created_at >= now() - interval '13 days'
      GROUP BY day
      ORDER BY day`;

    const topBots = await this.prisma.$queryRaw<{ id: string; name: string; deliveries: number }[]>`
      SELECT b.id::text AS id, b.name AS name, count(d.*)::int AS deliveries
      FROM bots b
      LEFT JOIN delivery_logs d ON d.bot_id = b.id
      GROUP BY b.id, b.name
      ORDER BY deliveries DESC, b.created_at DESC
      LIMIT 5`;

    return {
      users: { total: usersTotal, verified: usersVerified, admins },
      bots: { total: botsTotal, active: botsActive, withErrors: botsErrored },
      deliveries: {
        total: deliveriesTotal,
        success: deliveriesSuccess,
        failed: deliveriesTotal - deliveriesSuccess,
        last24h: deliveries24h,
      },
      series: this.fillSeries(rawSeries),
      topBots,
    };
  }

  /** Produces a continuous DAYS-long series (UTC), filling gaps with zeros. */
  private fillSeries(rows: { day: string; total: number; success: number }[]): DeliverySeriesPointDto[] {
    const byDay = new Map(rows.map((r) => [r.day, r]));
    const out: DeliverySeriesPointDto[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      const row = byDay.get(date);
      const total = row?.total ?? 0;
      const success = row?.success ?? 0;
      out.push({ date, total, success, failed: total - success });
    }
    return out;
  }
}
