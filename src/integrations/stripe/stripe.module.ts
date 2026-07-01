import { Module, forwardRef } from '@nestjs/common';
import { TransactionsModule } from '../../transactions/transactions.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [TransactionsModule, forwardRef(() => WhatsappModule)],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
