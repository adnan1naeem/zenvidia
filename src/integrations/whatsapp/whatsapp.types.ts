export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppUrlButton {
  displayText: string;
  url: string;
}

export interface WhatsAppCard {
  title: string;
  body: string;
  imageUrl?: string;
  buttons: WhatsAppButton[];
}

export interface SendResult {
  messageId: string;
}

export type InboundMessageType = 'text' | 'button' | 'interactive' | 'unknown';

export interface InboundMessage {
  from: string;
  messageId: string;
  type: InboundMessageType;
  text?: string;
  buttonPayload?: string;
}

export interface WhatsAppSendResponse {
  messages: Array<{ id: string }>;
}

interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  button?: { payload: string };
  interactive?: {
    button_reply?: { id: string };
    list_reply?: { id: string };
  };
}

interface WhatsAppWebhookValue {
  messages?: WhatsAppWebhookMessage[];
}

interface WhatsAppWebhookChange {
  value?: WhatsAppWebhookValue;
}

interface WhatsAppWebhookEntry {
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  entry?: WhatsAppWebhookEntry[];
}

export interface TestMessageOptions {
  customerName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  studioAddress?: string;
  depositUrl?: string;
}
