/**
 * Create (or reset the password of) an admin user.
 *
 *   bun run create-admin <email> <password>
 *
 * Reads DATABASE_URL from the environment (.env is loaded automatically).
 * Idempotent: if the email already exists, its password is updated — so this
 * doubles as a password reset. Complements the boot-time auto-seed.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '../generated/prisma/client';

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Использование: bun run create-admin <email> <password>');
    process.exit(1);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Некорректный email');
  if (password.length < 8) fail('Пароль должен быть не короче 8 символов');

  const url = process.env.DATABASE_URL;
  if (!url) fail('DATABASE_URL не задан (проверьте .env)');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const lower = email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email: lower },
      update: { passwordHash, role: UserRole.admin },
      create: { email: lower, passwordHash, role: UserRole.admin },
    });
    console.log(`✓ Администратор сохранён: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => fail((err as Error).message));
