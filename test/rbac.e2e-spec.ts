import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/generated/prisma/enums';
import { hashPassword } from '../src/common/security/password.util';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.createMany({
      data: [
        {
          email: 'admin@test.com',
          passwordHash: await hashPassword('Admin123!'),
          role: Role.ADMIN,
        },
        {
          email: 'user@test.com',
          passwordHash: await hashPassword('User123!'),
          role: Role.USER,
        },
      ],
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' });

    adminToken = adminLogin.body.accessToken;

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'User123!' });

    userToken = userLogin.body.accessToken;
  });

  it('blocks USER from admin route', () => {
    return request(app.getHttpServer())
      .get('/admin')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows ADMIN to admin route', () => {
    return request(app.getHttpServer())
      .get('/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});