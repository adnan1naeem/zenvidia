import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsModule } from '../../appointments/appointments.module';
import { BookingsModule } from '../../bookings/bookings.module';
import { StripeModule } from '../../integrations/stripe/stripe.module';
import { WhatsappModule } from '../../integrations/whatsapp/whatsapp.module';
import { ProductsModule } from '../../products/products.module';
import { Stage1ConfirmationController } from './stage1-confirmation.controller';
import { Stage1ConfirmationService } from './stage1-confirmation.service';

@Module({
  imports: [
    ProductsModule,
    AppointmentsModule,
    BookingsModule,
    forwardRef(() => StripeModule),
    forwardRef(() => WhatsappModule),
  ],
  controllers: [Stage1ConfirmationController],
  providers: [Stage1ConfirmationService],
  exports: [Stage1ConfirmationService],
})
export class Stage1ConfirmationModule {}
