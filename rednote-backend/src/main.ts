import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import session from 'express-session';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Ensure data directory exists for SQLite
  if (!existsSync('data')) {
    mkdirSync('data', { recursive: true });
    logger.log('Created data directory for database');
  }

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Configure session
  app.use(
    session({
      secret: configService.get<string>(
        'SESSION_SECRET',
        'rednote-default-secret-key-change-in-production',
      ),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );

  // Enable CORS
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
  logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
  logger.log(`Database: SQLite (data/rednote.db)`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
