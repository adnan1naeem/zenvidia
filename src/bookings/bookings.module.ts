import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { StripeModule } from '../integrations/stripe/stripe.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    UsersModule,
    AppointmentsModule,
    ProductsModule,
    forwardRef(() => StripeModule),
  ],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
