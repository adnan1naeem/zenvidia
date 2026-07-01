import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { AiService } from './ai.service';

@Module({
  imports: [ProductsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
