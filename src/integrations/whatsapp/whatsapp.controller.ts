import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { RawBodyRequest } from '../../common/raw-body-request';
import { ConversationService } from './conversation.service';
import { WhatsappService } from './whatsapp.service';
import type { WhatsAppWebhookPayload } from './whatsapp.types';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);
  private readonly processedMessages = new Set<string>();

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
    private readonly conversation: ConversationService,
  ) {}

  /** Meta webhook verification handshake */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.getOrThrow<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  /** Incoming messages and button replies */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest) {
    const rawBody = req.rawBody;
    const signature = req.headers['x-hub-signature-256'] as string;

    if (rawBody && signature) {
      const valid = this.whatsappService.verifySignature(
        rawBody.toString(),
        signature,
      );
      if (!valid) {
        this.logger.error('WhatsApp webhook signature invalid');
        throw new BadRequestException('Invalid signature');
      }
    }

    const message = this.whatsappService.parseInboundMessage(
      req.body as WhatsAppWebhookPayload,
    );

    if (!message) return { status: 'ok' };
    if (this.processedMessages.has(message.messageId)) {
      return { status: 'ok' };
    }
    this.processedMessages.add(message.messageId);

    this.logger.log(
      `Inbound ${message.type} from ***${message.from.slice(-4)}`,
    );

    if (message.type === 'text' && message.text) {
      await this.conversation.handleText(message.from, message.text);
      return { status: 'ok' };
    }

    if (message.type === 'interactive' || message.type === 'button') {
      const payload = message.buttonPayload;

      if (payload === 'cancel_conv') {
        await this.conversation.handleCancel(message.from);
      } else if (payload?.startsWith('category_')) {
        const categoryId = payload.slice('category_'.length);
        await this.conversation.handleCategorySelection(
          message.from,
          categoryId,
        );
      } else if (payload?.startsWith('select_')) {
        const serviceId = payload.slice('select_'.length);
        await this.conversation.handleServiceSelection(message.from, serviceId);
      } else if (payload?.startsWith('cancel_')) {
        await this.whatsappService.handleButtonReply(message.from, payload);
      }
    }

    return { status: 'ok' };
  }
}
