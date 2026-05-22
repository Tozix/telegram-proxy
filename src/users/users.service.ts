import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../generated/prisma/client';
import type { User } from '../../generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(email: string, password: string, role: UserRole = UserRole.admin): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { email: email.toLowerCase(), passwordHash, role } });
  }

  /** Seeds the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if no users exist. */
  async ensureAdmin(): Promise<void> {
    const count = await this.prisma.user.count();
    if (count > 0) return;

    const email = this.config.get<string>('admin.email')!;
    const password = this.config.get<string>('admin.password')!;
    await this.create(email, password, UserRole.admin);
    this.logger.log(`Seeded initial admin user: ${email}`);
  }
}
