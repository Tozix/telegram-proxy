import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global so any module can inject {@link PrismaService} without importing this. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
