import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TenantSettingsModel } from '../../generated/prisma/models/TenantSettings';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(tenantId: string): string {
    return `tenant:${tenantId}:settings`;
  }

  async getTenantSettings(tenantId: string): Promise<TenantSettingsModel | null> {
    const cachedSettings = await this.redisService.get(this.getCacheKey(tenantId));
    if (cachedSettings) {
      return JSON.parse(cachedSettings) as TenantSettingsModel;
    }

    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (settings) {
      await this.redisService.set(this.getCacheKey(tenantId), JSON.stringify(settings), 3600); // 1 hour TTL
    }

    return settings;
  }

  async updateTenantSettings(
    tenantId: string,
    data: Partial<TenantSettingsModel>,
  ): Promise<TenantSettingsModel> {
    const updatedSettings = await this.prisma.tenantSettings.update({
      where: { tenantId },
      data,
    });

    await this.redisService.del(this.getCacheKey(tenantId));
    return updatedSettings;
  }

  async createTenantSettings(tenantId: string, data: Partial<TenantSettingsModel>): Promise<TenantSettingsModel> {
    const newSettings = await this.prisma.tenantSettings.create({
      data: { ...data, tenant: { connect: { id: tenantId } } } as any,
    });
    await this.redisService.del(this.getCacheKey(tenantId));
    return newSettings;
  }
}