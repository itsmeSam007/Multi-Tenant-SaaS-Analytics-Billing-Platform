import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashPassword } from '../src/common/security/password.util';

describe('Auth – Account Lockout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = 'lock@test.com';
  const password = 'Password123!';

  beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);

  // 🔥 CLEAN DATABASE FIRST
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
    },
  });
});


  it('locks account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
    }

    // even correct password should fail now
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});