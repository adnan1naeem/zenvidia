import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { AppointmentStatus } from '../../database/enums/appointment-status.enum';
import { formatServiceSlot, formatUsd } from '../../common/zenvida-catalog';
import { AppointmentsService } from '../../appointments/appointments.service';
import { BookingsService } from '../../bookings/bookings.service';
import { ProductsService } from '../../products/products.service';
import { UsersService } from '../../users/users.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  /** Optional AI-narrowed service IDs pending category selection. */
  private readonly pendingServiceFilter = new Map<string, Set<string>>();

  constructor(
    private readonly ai: AiService,
    private readonly whatsapp: WhatsappService,
    private readonly users: UsersService,
    private readonly products: ProductsService,
    private readonly bookings: BookingsService,
    private readonly appointments: AppointmentsService,
  ) {}

  async handleText(phone: string, text: string): Promise<void> {
    await this.users.findOrCreateByPhone({ phone });

    const aiResponse = await this.ai.processMessage(phone, text);

    await this.whatsapp.sendText(phone, aiResponse.text);

    if (aiResponse.action === 'show_services') {
      const filterIds =
        aiResponse.serviceIds.length > 0
          ? new Set(aiResponse.serviceIds)
          : undefined;
      if (filterIds) {
        this.pendingServiceFilter.set(phone, filterIds);
      } else {
        this.pendingServiceFilter.delete(phone);
      }

      const allCategories = await this.products.listCategories();
      const categories = filterIds
        ? allCategories.filter((category) =>
            category.services.some((s) => filterIds.has(s.id)),
          )
        : allCategories;

      await this.whatsapp.sendCategoryList(phone, categories);
    } else if (aiResponse.action === 'end_conversation') {
      this.pendingServiceFilter.delete(phone);
      this.ai.clearHistory(phone);
    }
  }

  async handleCategorySelection(
    phone: string,
    categoryId: string,
  ): Promise<void> {
    await this.users.findOrCreateByPhone({ phone });

    const category = await this.products.getCategoryById(categoryId);
    if (!category) {
      await this.whatsapp.sendText(
        phone,
        'Sorry, that category is not available. Please try again.',
      );
      return;
    }

    const filterIds = this.pendingServiceFilter.get(phone);
    const services = filterIds
      ? category.services.filter((s) => filterIds.has(s.id))
      : category.services;

    if (services.length === 0) {
      await this.whatsapp.sendText(
        phone,
        'No matching services in that category. Please pick another category.',
      );
      return;
    }

    await this.whatsapp.sendServiceList(phone, category, services);
  }

  async handleServiceSelection(
    phone: string,
    serviceId: string,
  ): Promise<void> {
    await this.users.findOrCreateByPhone({ phone });

    const service = await this.products.getServiceById(serviceId);
    if (!service) {
      await this.whatsapp.sendText(
        phone,
        'Sorry, that service is not available. Please choose another option.',
      );
      return;
    }

    this.pendingServiceFilter.delete(phone);

    const result = await this.bookings.prepareDepositCheckout({
      phone,
      serviceId: service.id,
    });

    const slotLabel = formatServiceSlot(service.scheduledAt);

    if (result.kind === 'already_booked') {
      await this.whatsapp.sendText(
        phone,
        `Your appointment for *${service.title}* is already booked on ${slotLabel}.\n\n` +
          'No payment is needed — we look forward to seeing you at ZenVida!',
      );

      this.logger.log(
        `Already-booked notice sent for ${service.title} to ***${phone.slice(-4)}`,
        { appointmentId: result.appointment.id },
      );
      return;
    }

    const { appointment, checkoutUrl, reusedExisting } = result;

    const reuseNote = reusedExisting
      ? 'You already have an active booking for this service — here is your payment link again.\n\n'
      : '';

    await this.whatsapp.sendCtaUrl(
      phone,
      `${reuseNote}Great choice! You selected *${service.title}*.\n\n` +
        `${service.durationMinutes} min · ${slotLabel}\n` +
        `Deposit required: ${formatUsd(service.depositCents)}\n\n` +
        `Tap below to pay securely:`,
      { displayText: 'Pay deposit', url: checkoutUrl },
    );

    await this.whatsapp.sendButtons(
      phone,
      'Would you like to cancel instead?',
      [{ id: `cancel_${appointment.id}`, title: 'Cancel' }],
    );

    this.logger.log(
      `Checkout link sent for ${service.title} to ***${phone.slice(-4)}`,
      { appointmentId: appointment.id, reusedExisting },
    );
  }

  async handleCancel(phone: string, appointmentId?: string): Promise<void> {
    this.pendingServiceFilter.delete(phone);
    this.ai.clearHistory(phone);

    const user = await this.users.findByPhone(phone);
    if (user) {
      if (appointmentId) {
        const appointment = await this.appointments.findById(appointmentId);
        if (appointment?.user?.id === user.id) {
          await this.appointments.updateStatus(
            appointmentId,
            AppointmentStatus.Expired,
          );
        }
      } else {
        await this.appointments.expireActiveForUser(user.id);
      }
    }

    await this.whatsapp.sendText(
      phone,
      'No problem! We have cancelled the process. We hope to see you at ZenVida soon!',
    );
  }
}
