import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '../../generated/prisma/client';
import type { User } from '../../generated/prisma/client';
import { buildMeta } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

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
    return UserResponseDto.from(await this.create(lower, password));
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
    if ((await this.prisma.user.count()) <= 1) {
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
