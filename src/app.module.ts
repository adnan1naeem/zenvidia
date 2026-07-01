import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './integrations/stripe/stripe.module';
import { WhatsappModule } from './integrations/whatsapp/whatsapp.module';
import { ProductsModule } from './products/products.module';

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
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
