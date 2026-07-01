import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
  Res,
  forwardRef,
} from '@nestjs/common';
import type { Response } from 'express';
import Stripe from 'stripe';
import type { RawBodyRequest } from '../../common/raw-body-request';
import { TransactionsService } from '../../transactions/transactions.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly transactions: TransactionsService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsapp: WhatsappService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature');

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEvent(
        req.rawBody ?? Buffer.alloc(0),
        signature,
      );
    } catch {
      this.logger.error('Stripe webhook signature invalid');
      throw new BadRequestException('Invalid signature');
    }

    if (this.transactions.isRecordableEvent(event)) {
      if (await this.transactions.isEventProcessed(event.id)) {
        return { received: true };
      }
      await this.transactions.recordStripeEvent({ event });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { bookingId, customerPhone, serviceName, appointmentDate } =
          session.metadata ?? {};

        this.logger.log('checkout.session.completed', {
          sessionId: session.id,
          bookingId,
        });

        if (customerPhone && session.payment_status === 'paid') {
          const service = serviceName ?? 'your appointment';
          const date = appointmentDate ? ` on ${appointmentDate}` : '';
          const msg =
            `Payment confirmed! Your deposit for ${service}${date} has been received.\n` +
            `Your appointment at ZenVida is fully secured. See you soon!`;

          await this.whatsapp.sendText(customerPhone, msg);
          this.logger.log('Payment confirmation sent via WhatsApp', {
            bookingId,
            phone: `***${customerPhone.slice(-4)}`,
          });
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  @Get('success')
  success(@Res() res: Response) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <style>
          body {
            font-family: Arial;
            text-align: center;
            margin-top: 80px;
          }
        </style>
      </head>
      <body>
        <h1>✅ Payment Successful</h1>
        <p>Your payment has been received.</p>
        <p>You will receive a confirmation message on WhatsApp shortly.</p>
      </body>
      </html>
    `);
  }

  @Get('cancel')
  cancel(@Res() res: Response) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Cancelled</title>
      </head>
      <body style="font-family:Arial;text-align:center;margin-top:80px">
        <h1>❌ Payment Cancelled</h1>
        <p>No payment was made.</p>
        <p>You may return to WhatsApp and try again.</p>
      </body>
      </html>
    `);
  }
}
