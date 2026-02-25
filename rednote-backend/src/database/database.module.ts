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
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3' as const,
        database: configService.get<string>(
          'DATABASE_PATH',
          'data/rednote.db',
        ),
        entities: [User, Content],
        synchronize: true, // Auto-create tables (disable in production)
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([User, Content]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
