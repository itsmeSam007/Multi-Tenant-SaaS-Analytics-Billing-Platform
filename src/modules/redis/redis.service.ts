import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      return this.redisClient.setex(key, ttl, value);
    } else {
      return this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }
}