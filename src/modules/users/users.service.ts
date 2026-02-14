import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
  return this.prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,

      // 🔐 REQUIRED for auth hardening
      failedLoginCount: true,
      lockUntil: true,
      refreshTokenHash: true,
      refreshTokenUsedAt: true,
      isActive: true,
    },
  });
}

  async createUser(params: {
    email: string;
    passwordHash: string;
    role?: Role;
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        role: params.role ?? Role.USER,
      },
    });
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}