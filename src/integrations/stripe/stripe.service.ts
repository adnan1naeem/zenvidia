import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  AddonCheckoutParams,
  CheckoutResult,
  DepositCheckoutParams,
} from './stripe.types';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'));
  }

  async createDepositCheckoutLink(
    params: DepositCheckoutParams,
  ): Promise<CheckoutResult> {
    const baseUrl = this.config.getOrThrow<string>('APP_BASE_URL');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: `Deposit — ${params.serviceName}`,
              description: `Booking on ${params.appointmentDate}`,
            },
            unit_amount: params.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: params.bookingId,
        customerPhone: params.customerPhone,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        type: 'deposit',
        ...(params.customerEmail
          ? { customerEmail: params.customerEmail }
          : {}),
      },
      ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
      success_url: `${baseUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/stripe/cancel`,
    });

    this.logger.log('Deposit checkout session created', {
      bookingId: params.bookingId,
      sessionId: session.id,
    });

    return { sessionId: session.id, url: session.url! };
  }

  async createAddonCheckoutLink(
    params: AddonCheckoutParams,
  ): Promise<CheckoutResult> {
    const baseUrl = this.config.getOrThrow<string>('APP_BASE_URL');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: { name: `Extra - ${params.addonName}` },
            unit_amount: params.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: params.bookingId,
        customerPhone: params.customerPhone,
        type: 'addon',
      },
      success_url: `${baseUrl}/stripe/success`,
      cancel_url: `${baseUrl}/stripe/cancel`,
    });

    this.logger.log('Addon checkout session created', {
      bookingId: params.bookingId,
      sessionId: session.id,
    });

    return { sessionId: session.id, url: session.url! };
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
    );
  }
}
