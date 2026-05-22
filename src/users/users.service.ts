import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async create(email: string, password: string, role: UserRole = UserRole.Admin): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.users.create({ email: email.toLowerCase(), passwordHash, role });
    return this.users.save(user);
  }

  /** Seeds the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if no users exist. */
  async ensureAdmin(): Promise<void> {
    const count = await this.users.count();
    if (count > 0) return;

    const email = this.config.get<string>('admin.email')!;
    const password = this.config.get<string>('admin.password')!;
    await this.create(email, password, UserRole.Admin);
    this.logger.log(`Seeded initial admin user: ${email}`);
  }
}
