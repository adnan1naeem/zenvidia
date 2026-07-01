import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [DatabaseModule, AppointmentsModule, UsersModule],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
