import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Used by the Prisma CLI (`prisma db push`, `prisma generate`). The app runtime
// connects through the @prisma/adapter-pg driver adapter in PrismaService.
//
// NB: we read process.env.DATABASE_URL directly (not the `env()` helper, which
// throws when the var is missing) so that `prisma generate` works at build time
// without a database — only `db push` actually needs the URL (set at runtime).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
