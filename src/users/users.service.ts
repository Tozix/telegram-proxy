import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Prisma, UserRole } from '../../generated/prisma/client';
import type { User } from '../../generated/prisma/client';
import { buildMeta } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

  /** Creates an already-verified user (admin paths: seed, admin CRUD, CLI). */
  async create(email: string, password: string, role: UserRole = UserRole.admin): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, role, emailVerifiedAt: new Date() },
    });
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

  // ----- self-registration + email verification -----

  /** Registers an UNVERIFIED `user` and returns the verification token to email. */
  async registerUser(email: string, password: string): Promise<{ user: User; token: string }> {
    const lower = email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email: lower } })) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: lower,
        passwordHash,
        role: UserRole.user,
        verificationToken: token,
        verificationSentAt: new Date(),
      },
    });
    return { user, token };
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { verificationToken: token } });
    if (!user) throw new BadRequestException('Недействительная или уже использованная ссылка');
    if (Date.now() - (user.verificationSentAt?.getTime() ?? 0) > VERIFICATION_TTL_MS) {
      throw new BadRequestException('Срок действия ссылки истёк, запросите новую');
    }
    return this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null },
    });
  }

  /** Issues a fresh token for an unverified user; null if not found / already verified. */
  async refreshVerification(email: string): Promise<{ user: User; token: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.emailVerifiedAt) return null;
    const token = randomBytes(32).toString('hex');
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationSentAt: new Date() },
    });
    return { user: updated, token };
  }

  // ----- admin management (returns DTOs) -----

  async findAll(limit: number, offset: number): Promise<PaginatedUsersDto> {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ orderBy: { createdAt: 'asc' }, skip: offset, take: limit }),
      this.prisma.user.count(),
    ]);
    return { ...buildMeta(total, limit, offset), items: users.map((u) => UserResponseDto.from(u)) };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.getEntity(id));
  }

  async createAdmin(email: string, password: string): Promise<UserResponseDto> {
    const lower = email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email: lower } })) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    return UserResponseDto.from(await this.create(lower, password, UserRole.admin));
  }

  async updateAdmin(id: string, dto: { email?: string; password?: string }): Promise<UserResponseDto> {
    const user = await this.getEntity(id);
    const data: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined && dto.email.toLowerCase() !== user.email) {
      const lower = dto.email.toLowerCase();
      const clash = await this.prisma.user.findUnique({ where: { email: lower } });
      if (clash && clash.id !== id) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      data.email = lower;
    }
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return UserResponseDto.from(await this.prisma.user.update({ where: { id }, data }));
  }

  async deleteAdmin(id: string, currentUserId: string): Promise<void> {
    const user = await this.getEntity(id);
    if (user.id === currentUserId) {
      throw new BadRequestException('Нельзя удалить собственную учётную запись');
    }
    if ((await this.prisma.user.count({ where: { role: UserRole.admin } })) <= 1 && user.role === UserRole.admin) {
      throw new BadRequestException('Нельзя удалить последнего администратора');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  private async getEntity(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }
}
