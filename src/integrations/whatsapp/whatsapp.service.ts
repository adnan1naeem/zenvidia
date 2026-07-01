import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { AppointmentsService } from 'src/appointments/appointments.service';
import {
  ZenVidaCategory,
  ZenVidaService,
  formatServiceSlot,
  formatUsd,
} from '../../common/zenvida-catalog';
import { AppointmentStatus } from '../../database/enums/appointment-status.enum';
import {
  InboundMessage,
  InboundMessageType,
  SendResult,
  WhatsAppButton,
  WhatsAppCard,
  WhatsAppSendResponse,
  WhatsAppUrlButton,
  WhatsAppWebhookPayload,
} from './whatsapp.types';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly appointments: AppointmentsService,
  ) {
    this.token = config.getOrThrow<string>('WHATSAPP_TOKEN');
    this.phoneNumberId = config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.baseUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  }

  async sendText(to: string, body: string): Promise<SendResult> {
    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
    this.logger.log(`Text sent to ***${to.slice(-4)}`, {
      messageId: res.messages[0].id,
    });
    return { messageId: res.messages[0].id };
  }

  async sendButtons(
    to: string,
    body: string,
    buttons: WhatsAppButton[],
    urlButton?: WhatsAppUrlButton,
  ): Promise<SendResult> {
    // Single URL button only — use the cta_url interactive type
    if (urlButton && buttons.length === 0) {
      return this.sendCtaUrl(to, body, urlButton);
    }

    const replyButtons = buttons.slice(0, 3).map((b) => ({
      type: 'reply' as const,
      reply: { id: b.id, title: b.title },
    }));

    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: { buttons: replyButtons },
      },
    });
    this.logger.log(`Buttons sent to ***${to.slice(-4)}`, {
      messageId: res.messages[0].id,
    });
    return { messageId: res.messages[0].id };
  }

  /** Single CTA URL button — cannot be combined with reply buttons in one message */
  async sendCtaUrl(
    to: string,
    body: string,
    urlButton: WhatsAppUrlButton,
  ): Promise<SendResult> {
    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: body },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: urlButton.displayText,
            url: urlButton.url,
          },
        },
      },
    });

    this.logger.log(`CTA URL sent to ***${to.slice(-4)}`, {
      messageId: res.messages[0].id,
    });
    return { messageId: res.messages[0].id };
  }

  async sendCarousel(to: string, cards: WhatsAppCard[]): Promise<SendResult> {
    const sections = cards.map((card) => ({
      title: card.title,
      rows: card.buttons.map((b) => ({
        id: b.id,
        title: b.title,
        description: card.body,
      })),
    }));

    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: 'Choose an option to add to your appointment:' },
        action: { button: 'View options', sections },
      },
    });

    this.logger.log(`Carousel sent to ***${to.slice(-4)}`, {
      messageId: res.messages[0].id,
    });
    return { messageId: res.messages[0].id };
  }

  /** WhatsApp list messages allow at most 10 rows total. */
  private static readonly MAX_LIST_ROWS = 10;

  async sendCategoryList(
    to: string,
    categories: ZenVidaCategory[],
  ): Promise<SendResult> {
    const rows = categories
      .slice(0, WhatsappService.MAX_LIST_ROWS)
      .map((category) => ({
        id: `category_${category.id}`,
        title: category.name.slice(0, 24),
        description: `${category.services.length} services`.slice(0, 72),
      }));

    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: 'Which category would you like to explore?' },
        action: {
          button: 'View categories',
          sections: [{ title: 'Categories', rows }],
        },
      },
    });

    this.logger.log(`Category list sent to ***${to.slice(-4)}`);
    return { messageId: res.messages[0].id };
  }

  async sendServiceList(
    to: string,
    category: ZenVidaCategory,
    services: ZenVidaService[],
  ): Promise<SendResult> {
    const rows = services.slice(0, WhatsappService.MAX_LIST_ROWS).map((s) => ({
      id: `select_${s.id}`,
      title: s.title.slice(0, 24),
      description:
        `${formatUsd(s.priceCents)} · ${s.durationMinutes} min · ${formatServiceSlot(s.scheduledAt)}`.slice(
          0,
          72,
        ),
    }));

    const res = await this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: `Services in *${category.name}* — pick one to book:` },
        action: {
          button: 'View services',
          sections: [{ title: category.name.slice(0, 24), rows }],
        },
      },
    });

    this.logger.log(`Service list sent to ***${to.slice(-4)}`, {
      categoryId: category.id,
      count: rows.length,
    });
    return { messageId: res.messages[0].id };
  }

  verifySignature(rawBody: string, signature: string): boolean {
    const secret = this.config.getOrThrow<string>('WHATSAPP_APP_SECRET');
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  parseInboundMessage(body: WhatsAppWebhookPayload): InboundMessage | null {
    try {
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg) return null;

      const { from, id: messageId } = msg;

      let type: InboundMessageType = 'unknown';
      let text: string | undefined;
      let buttonPayload: string | undefined;

      if (msg.type === 'text') {
        type = 'text';
        text = msg.text?.body;
      } else if (msg.type === 'button') {
        type = 'button';
        buttonPayload = msg.button?.payload;
      } else if (msg.type === 'interactive') {
        type = 'interactive';
        buttonPayload =
          msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id;
      }

      return { from, messageId, type, text, buttonPayload };
    } catch {
      return null;
    }
  }

  /** Strip leading + so WhatsApp API receives digits-only E.164 */
  normalizePhone(phone: string): string {
    return phone.replace(/^\+/, '');
  }

  private async post(payload: object): Promise<WhatsAppSendResponse> {
    try {
      const { data } = await axios.post<WhatsAppSendResponse>(
        this.baseUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as Record<string, unknown> | undefined;
        this.logger.error('WhatsApp API error', {
          status: err.response?.status,
          error: body?.error,
        });
        const msg =
          (body?.error as any)?.message ?? err.message ?? 'WhatsApp API error';
        throw new Error(msg);
      }
      throw err;
    }
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

    await this.sendText(
      phone,
      `Thanks, ${customerName}! Your ${serviceName} appointment has been cancelled. We hope to see you at ZenVida soon.`,
    );

    this.logger.log('Appointment cancelled — confirmation sent', {
      appointmentId,
    });
    return true;
  }
}
