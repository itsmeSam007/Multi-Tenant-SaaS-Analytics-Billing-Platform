import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { envSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
      process.env.NODE_ENV === 'test'
        ? '.env.test'
        : '.env',
      load: [appConfig, databaseConfig],
      validate: (env) => envSchema.parse(env), //validate: (env: NodeJS.ProcessEnv) => envSchema.parse(env),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
