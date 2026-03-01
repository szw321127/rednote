import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Content } from './entities/content.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DATABASE_TYPE', 'sqlite');
        
        // PostgreSQL configuration
        if (dbType === 'postgres') {
          return {
            type: 'postgres' as const,
            host: configService.get<string>('DATABASE_HOST', 'localhost'),
            port: configService.get<number>('DATABASE_PORT', 5432),
            username: configService.get<string>('DATABASE_USER', 'rednote'),
            password: configService.get<string>('DATABASE_PASSWORD'),
            database: configService.get<string>('DATABASE_NAME', 'rednote'),
            entities: [User, Content],
            synchronize: true, // Auto-create tables (disable in production after first run)
            logging: configService.get<string>('NODE_ENV') === 'development',
          };
        }
        
        // SQLite configuration (default)
        return {
          type: 'better-sqlite3' as const,
          database: configService.get<string>('DATABASE_PATH', 'data/rednote.db'),
          entities: [User, Content],
          synchronize: true,
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature([User, Content]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
