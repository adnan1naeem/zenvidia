import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Product } from './entities/product.entity';
import { TransactionHistory } from './entities/transaction-history.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('SUPABASE_DB_URL'),
        entities: [Product, User, Appointment, TransactionHistory],
        synchronize: false,
        ssl:
          config.get<string>('SUPABASE_DB_SSL', 'true') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    TypeOrmModule.forFeature([Product, User, Appointment, TransactionHistory]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
