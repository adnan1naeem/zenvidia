import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [DatabaseModule],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
