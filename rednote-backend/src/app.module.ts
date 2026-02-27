import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { GenerateModule } from './generate/generate.module';
import { AiModule } from './ai/ai.module';
import { ConfigStorageModule } from './config-storage/config-storage.module';
import { SessionModule } from './session/session.module';
import { StatsModule } from './stats/stats.module';
import { validateEnv } from './config/env.validation';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    // Rate limiting: 60 requests per minute per IP
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    GenerateModule,
    AiModule,
    ConfigStorageModule,
    SessionModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
