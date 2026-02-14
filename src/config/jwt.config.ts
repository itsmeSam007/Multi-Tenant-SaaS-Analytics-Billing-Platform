import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessTokenSecret: process.env.JWT_SECRET!,
  accessTokenTtlSeconds: 900, // 15 minutes
}));