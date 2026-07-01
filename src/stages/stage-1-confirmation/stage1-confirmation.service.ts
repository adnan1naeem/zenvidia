import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { formatUsd } from '../../common/zenvida-catalog';
import { AppointmentStatus } from '../../database/enums/appointment-status.enum';
import { AppointmentsService } from '../../appointments/appointments.service';
import { BookingsService } from '../../bookings/bookings.service';
import { WhatsappService } from '../../integrations/whatsapp/whatsapp.service';
import { ProductsService } from '../../products/products.service';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';

@Injectable()
export class Stage1ConfirmationService {
  private readonly logger = new Logger(Stage1ConfirmationService.name);

  constructor(
    private readonly products: ProductsService,
    private readonly bookings: BookingsService,
    private readonly appointments: AppointmentsService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async confirm(dto: ConfirmBookingDto) {
    const service = await this.products.getServiceById(dto.serviceId);
    if (!service) {
      throw new NotFoundException(`Service not found: ${dto.serviceId}`);
    }

    const phone = this.whatsapp.normalizePhone(dto.phone);

    const { appointment, checkoutUrl } =
      await this.bookings.prepareDepositCheckout({
        phone,
        serviceId: service.id,
        customerName: dto.name,
        email: dto.email,
      });

    const depositUsd = formatUsd(service.depositCents);

    await this.whatsapp.sendCtaUrl(
      phone,
      `Hi ${dto.name}! Your ${service.title} appointment is confirmed.\n` +
        `Deposit required: ${depositUsd}\n\n` +
        `Tap below to pay your deposit securely:`,
      { displayText: 'Pay deposit', url: checkoutUrl },
    );

    const { messageId } = await this.whatsapp.sendButtons(
      phone,
      'Want to cancel instead? Tap the button below.',
      [{ id: `cancel_${appointment.id}`, title: 'Cancel' }],
    );

    return {
      bookingId: appointment.id,
      serviceId: dto.serviceId,
      checkoutUrl,
      whatsappMessageId: messageId,
    };
  }

  async handleButtonReply(
    phone: string,
    buttonId: string | undefined,
  ): Promise<boolean> {
    if (!buttonId) return false;

    if (buttonId.startsWith('cancel_')) {
      return this.handleCancel(phone, buttonId.slice(7));
    }
    return false;
  }

  private async handleCancel(
    phone: string,
    appointmentId: string,
  ): Promise<boolean> {
    const appointment = await this.appointments.findById(appointmentId);
    if (!appointment) {
      this.logger.warn('Cancel received for unknown appointment', {
        appointmentId,
        phone: `***${phone.slice(-4)}`,
      });
      return false;
    }

    if (appointment.user?.phone !== phone) {
      this.logger.warn('Cancel phone mismatch', {
        appointmentId,
        phone: `***${phone.slice(-4)}`,
      });
      return false;
    }

    await this.appointments.updateStatus(
      appointmentId,
      AppointmentStatus.Expired,
    );

    const customerName = appointment.user?.name ?? 'there';
    const serviceName = appointment.product?.title ?? 'your appointment';

    await this.whatsapp.sendText(
      phone,
      `Thanks, ${customerName}! Your ${serviceName} appointment has been cancelled. We hope to see you at ZenVida soon.`,
    );

    this.logger.log('Appointment cancelled — confirmation sent', {
      appointmentId,
    });
    return true;
  }
}
