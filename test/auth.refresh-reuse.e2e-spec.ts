import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashPassword } from '../src/common/security/password.util';
import cookieParser from 'cookie-parser';

describe('Auth – Refresh Token Reuse (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let refreshToken: string;

  const email = 'refresh@test.com';
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    const setCookieHeader = login.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader as string];

    const rawCookie = cookies.find((c) => c.startsWith('refresh_token='));
    if (!rawCookie) throw new Error('No refresh_token cookie in login response');

    refreshToken = decodeURIComponent(rawCookie.split(';')[0].split('=')[1]);

    // 🔍 DEBUG
    console.log('=== LOGIN DEBUG ===');
    console.log('rawCookie:', rawCookie.substring(0, 80));
    console.log('refreshToken (decoded) prefix:', refreshToken.substring(0, 50));
  });

  it('allows refresh only once', async () => {
    // 🔍 DEBUG
    console.log('=== FIRST REQUEST ===');
    console.log('Sending token prefix:', refreshToken.substring(0, 50));

    const firstResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`)
      .expect(201);

    // 🔍 DEBUG
    console.log('=== FIRST RESPONSE ===');
    console.log('set-cookie header:', firstResponse.headers['set-cookie']);

    // 🔍 DEBUG
    console.log('=== SECOND REQUEST ===');
    console.log('Sending SAME token prefix:', refreshToken.substring(0, 50));

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`)
      .expect(401);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});