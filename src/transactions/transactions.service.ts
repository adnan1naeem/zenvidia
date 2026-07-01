import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { TransactionHistory } from '../database/entities/transaction-history.entity';
import { AppointmentStatus } from '../database/enums/appointment-status.enum';
import { AppointmentsService } from '../appointments/appointments.service';
import { UsersService } from '../users/users.service';

const RECORDABLE_CHECKOUT_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.async_payment_failed',
]);

type RecordableCheckoutEventType =
  'checkout.session.completed' | 'checkout.session.async_payment_failed';

type RecordableCheckoutEvent = Stripe.Event & {
  type: RecordableCheckoutEventType;
};

function isRecordableCheckoutEvent(
  event: Stripe.Event,
): event is RecordableCheckoutEvent {
  return RECORDABLE_CHECKOUT_EVENTS.has(event.type);
}

export interface RecordStripeEventParams {
  event: Stripe.Event;
  appointmentId?: string | null;
  email?: string | null;
  phone?: string | null;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(TransactionHistory)
    private readonly transactionsRepo: Repository<TransactionHistory>,
    private readonly appointments: AppointmentsService,
    private readonly users: UsersService,
  ) {}

  async isEventProcessed(eventId: string): Promise<boolean> {
    const count = await this.transactionsRepo.count({
      where: { stripeEventId: eventId },
    });
    return count > 0;
  }

  isRecordableEvent(event: Stripe.Event): event is RecordableCheckoutEvent {
    return isRecordableCheckoutEvent(event);
  }

  async recordStripeEvent(
    params: RecordStripeEventParams,
  ): Promise<TransactionHistory | null> {
    const { event } = params;
    if (!isRecordableCheckoutEvent(event)) {
      return null;
    }

    const existing = await this.transactionsRepo.findOne({
      where: { stripeEventId: event.id },
    });
    if (existing) {
      return null;
    }

    const extracted = this.extractStripeFields(event);
    const rawAppointmentId =
      params.appointmentId ??
      extracted.appointmentId ??
      (await this.resolveAppointmentId(extracted.checkoutSessionId));
    const appointmentId = await this.validateAppointmentId(rawAppointmentId);

    const email = params.email ?? extracted.email;
    const phone = params.phone ?? extracted.phone;
    const user = phone
      ? await this.users.findOrCreateByPhone({
          phone,
          email,
          name: extracted.name,
        })
      : null;

    const record = this.transactionsRepo.create({
      stripeEventId: event.id,
      stripePaymentIntentId: extracted.paymentIntentId,
      stripeCheckoutSessionId: extracted.checkoutSessionId,
      stripeCustomerId: extracted.customerId,
      stripeChargeId: extracted.chargeId,
      amount: extracted.amount,
      currency: extracted.currency,
      appointmentId,
      user: user ?? null,
      email,
      phone,
      paymentStatus: extracted.paymentStatus,
      webhookEventType: event.type,
    });

    const saved = await this.transactionsRepo.save(record);
    await this.syncAppointmentStatus(event, appointmentId);
    this.logger.log('Stripe event recorded', {
      eventId: event.id,
      type: event.type,
      appointmentId,
    });
    return saved;
  }

  private async syncAppointmentStatus(
    event: RecordableCheckoutEvent,
    appointmentId: string | null,
  ): Promise<void> {
    if (!appointmentId) return;

    const status = this.mapEventToAppointmentStatus(event);
    if (!status) return;

    const current = await this.appointments.findById(appointmentId);
    if (!current) return;

    if (
      current.status === AppointmentStatus.Booked &&
      status !== AppointmentStatus.Booked
    ) {
      return;
    }

    await this.appointments.updateStatus(appointmentId, status);
  }

  private mapEventToAppointmentStatus(
    event: RecordableCheckoutEvent,
  ): AppointmentStatus | null {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          return AppointmentStatus.Booked;
        }
        return null;
      }
      case 'checkout.session.async_payment_failed':
        return AppointmentStatus.Failed;
      default:
        return null;
    }
  }

  private async validateAppointmentId(
    id: string | null,
  ): Promise<string | null> {
    if (!id) return null;

    const appointment = await this.appointments.findById(id);
    if (!appointment) {
      this.logger.warn(
        'Stripe event references unknown appointment — recording without link',
        {
          appointmentId: id,
        },
      );
      return null;
    }

    return id;
  }

  private async resolveAppointmentId(
    checkoutSessionId: string | null,
  ): Promise<string | null> {
    if (!checkoutSessionId) return null;

    const prior = await this.transactionsRepo.findOne({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      order: { createdAt: 'DESC' },
    });
    return prior?.appointmentId ?? null;
  }

  private extractStripeFields(event: RecordableCheckoutEvent): {
    appointmentId: string | null;
    paymentIntentId: string | null;
    checkoutSessionId: string | null;
    customerId: string | null;
    chargeId: string | null;
    amount: number | null;
    currency: string | null;
    email: string | null;
    phone: string | null;
    name: string | null;
    paymentStatus: string | null;
  } {
    const empty = {
      appointmentId: null,
      paymentIntentId: null,
      checkoutSessionId: null,
      customerId: null,
      chargeId: null,
      amount: null,
      currency: null,
      email: null,
      phone: null,
      name: null,
      paymentStatus: null,
    };

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        return {
          ...empty,
          appointmentId: session.metadata?.bookingId ?? null,
          paymentIntentId: this.asString(session.payment_intent),
          checkoutSessionId: session.id,
          customerId: this.asString(session.customer),
          amount: session.amount_total,
          currency: session.currency,
          email: session.customer_details?.email ?? session.customer_email,
          phone:
            session.metadata?.customerPhone ??
            session.customer_details?.phone ??
            null,
          name: session.customer_details?.name ?? null,
          paymentStatus: session.payment_status,
        };
      }
      default:
        return empty;
    }
  }

  private asString(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return String((value as { id: string }).id);
    }
    return null;
  }
}
