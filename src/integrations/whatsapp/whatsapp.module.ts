import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { AppointmentsModule } from '../../appointments/appointments.module';
import { BookingsModule } from '../../bookings/bookings.module';
import { ProductsModule } from '../../products/products.module';
import { UsersModule } from '../../users/users.module';
import { Stage1ConfirmationModule } from '../../stages/stage-1-confirmation/stage1-confirmation.module';
import { StripeModule } from '../stripe/stripe.module';
import { ConversationService } from './conversation.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    ProductsModule,
    AiModule,
    UsersModule,
    AppointmentsModule,
    BookingsModule,
    forwardRef(() => Stage1ConfirmationModule),
    forwardRef(() => StripeModule),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, ConversationService],
  exports: [WhatsappService, ConversationService],
})
export class WhatsappModule {}
