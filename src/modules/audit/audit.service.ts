import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    ip?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: params,
    });
  }
}
