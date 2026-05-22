import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Used by the Prisma CLI (`prisma db push`, `prisma generate`). The app runtime
// connects through the @prisma/adapter-pg driver adapter in PrismaService.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
