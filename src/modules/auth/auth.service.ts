import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';


import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  verifyToken,
} from '../../common/security/password.util';
import { Role } from '../../generated/prisma/enums';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService, // ADD THIS
  ) {}

  // =========================
  // Register
  // =========================
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      role: Role.USER, // ✅ default role assignment
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  // =========================
// Validate user (for controller usage)
// =========================
async validateUser(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new UnauthorizedException('Account temporarily locked');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  return user;
}

  // =========================
  // Login
  // =========================
  async login(email: string, password: string) {
    
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔒 Account locked?
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: { increment: 1 },
          lockUntil:
            user.failedLoginCount + 1 >= 5
              ? new Date(Date.now() + 15 * 60 * 1000) // 15 min
              : null,
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ Reset counters on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockUntil: null,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role, // ✅ CORRECT
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // =========================
  // Token helpers
  // =========================
  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload);


    const refreshToken = await this.generateRefreshToken(
      userId,
      email,
      role,
    );

    // const refreshToken = await this.jwtService.signAsync(
    //   //{ sub: userId },
    //   {secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'},
    //   { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
    // );

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(
  userId: string,
  email: string,
  role: Role,
) {
  const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET not defined');
  }

  return this.jwtService.signAsync(
    {
      sub: userId,
      email,
      role,
      jti: randomUUID(), // ← guarantees uniqueness even within the same second
    },
    {
      secret: refreshSecret,
      expiresIn: '7d',
    },
  );
}


  private async updateRefreshToken(userId: string, refreshToken: string) {
  const hashed = hashToken(refreshToken); // ← sync, no await needed

  await this.prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash: hashed,
    },
  });
}

// =========================
// Refresh flow
// =========================
async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.refreshTokenHash) {
    throw new UnauthorizedException('Token reuse detected or session expired');
  }

  // Use verifyToken (SHA-256) not verifyPassword (bcrypt) — JWTs exceed 72 bytes
  const isValid = verifyToken(refreshToken, user.refreshTokenHash);

  if (!isValid) {
    await this.logout(userId);
    throw new UnauthorizedException('Token reuse detected');
  }

  // Atomically claim the session
  const result = await this.prisma.$executeRaw`
    UPDATE users
    SET "refreshTokenHash" = NULL
    WHERE id = ${userId}
    AND "refreshTokenHash" IS NOT NULL
  `;

  if (result === 0) {
    throw new UnauthorizedException('Token reuse detected');
  }

  const tokens = await this.generateTokens(
    user.id,
    user.email,
    user.role,
  );

  await this.updateRefreshToken(user.id, tokens.refreshToken);

  return tokens;
}

  // =========================
  // Logout
  // =========================
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}