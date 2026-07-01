import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { Product } from '../database/entities/product.entity';
import { Appointment } from '../database/entities/appointment.entity';
import { ServiceId } from '../database/enums/service-id.enum';
import { StripeService } from '../integrations/stripe/stripe.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

export interface PrepareDepositCheckoutParams {
  phone: string;
  serviceId: ServiceId;
  email?: string | null;
  customerName?: string | null;
}

export type DepositCheckoutResult =
  | {
      kind: 'checkout';
      appointment: Appointment;
      checkoutUrl: string;
      sessionId: string;
      reusedExisting: boolean;
    }
  | {
      kind: 'already_booked';
      appointment: Appointment;
    };

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly users: UsersService,
    private readonly appointments: AppointmentsService,
    private readonly products: ProductsService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripe: StripeService,
  ) {}

  async prepareDepositCheckout(
    params: PrepareDepositCheckoutParams,
  ): Promise<DepositCheckoutResult> {
    const product = await this.products.getProductByServiceId(params.serviceId);
    if (!product) {
      throw new NotFoundException(`Service not found: ${params.serviceId}`);
    }

    const user = await this.users.findOrCreateByPhone({
      phone: params.phone,
      email: params.email,
      name: params.customerName,
    });

    const bookedAppointment = await this.appointments.findBookedForUserAndProduct(
      user.id,
      product.id,
    );
    if (bookedAppointment) {
      this.logger.log('User already has booked appointment for service', {
        appointmentId: bookedAppointment.id,
        serviceId: product.serviceId,
      });
      return { kind: 'already_booked', appointment: bookedAppointment };
    }

    let appointment = await this.appointments.findActiveForUserAndProduct(
      user.id,
      product.id,
    );
    let reusedExisting = false;

    if (appointment) {
      reusedExisting = true;
      this.logger.log('Reusing active appointment', {
        appointmentId: appointment.id,
        serviceId: product.serviceId,
      });
    } else {
      appointment = await this.appointments.create({
        userId: user.id,
        productUuid: product.id,
      });
    }

    const appointmentDate = this.formatAppointmentDate(product);

    const { url, sessionId } = await this.stripe.createDepositCheckoutLink({
      bookingId: appointment.id,
      customerPhone: user.phone,
      serviceName: product.title,
      appointmentDate,
      amountCents: product.depositCents,
      currency: product.currency,
      customerEmail: user.email ?? params.email ?? undefined,
    });

    return {
      kind: 'checkout',
      appointment,
      checkoutUrl: url,
      sessionId,
      reusedExisting,
    };
  }

  private formatAppointmentDate(product: Product): string {
    const date =
      product.scheduledAt instanceof Date
        ? product.scheduledAt
        : new Date(product.scheduledAt);
    return date.toISOString().slice(0, 10);
  }
}
