import { PrismaService } from '../../src/prisma/prisma.service';

export async function clearDatabase(prisma: PrismaService) {
  await prisma.user.deleteMany();
}
