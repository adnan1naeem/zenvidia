import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './integrations/stripe/stripe.module';
import { WhatsappModule } from './integrations/whatsapp/whatsapp.module';
import { ProductsModule } from './products/products.module';
import { Stage1ConfirmationModule } from './stages/stage-1-confirmation/stage1-confirmation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    DatabaseModule,
    ProductsModule,
    StripeModule,
    WhatsappModule,
    Stage1ConfirmationModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
