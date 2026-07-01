---
name: whatsapp-messaging
description: >-
  Designs and implements WhatsApp Business API messages for ZenVida — buttons,
  carousels, templates, and delivery tracking. Use when writing message content,
  interactive elements, or the WhatsApp integration layer.
---

# WhatsApp Messaging

## Message Types by Stage

| Stage          | Format                   | Interactive elements               |
| -------------- | ------------------------ | ---------------------------------- |
| 1 Confirmation | Text + buttons           | Pay Deposit (URL), Confirm, Cancel |
| 2 Deposit      | Text + URL               | Payment link in reminder text      |
| 3 Reminders    | Text                     | Studio address inline              |
| 4 Upselling    | Carousel + quick replies | One card per add-on offer          |
| 5 Follow-up    | Text + URL               | Review link at +2h                 |

## Template Guidelines

- **Language:** Spanish for customers (studio is in Madrid); code comments in English.
- **Personalization:** `[name]`, `[service]`, `[date]`, `[time]`.
- **Deposit:** booking price via Stripe Payment Link.
- **Buttons:** Max 3 reply buttons; URL buttons for payment and review links.

## Example — Stage 1 Confirmation

```
Hola [name]! Tu cita de [service] está confirmada:
📅 [date] a las [time]
📍 [studio address]

Para asegurar tu reserva, paga el depósito:
[Pay Deposit button → Stripe URL]

[Confirm] [Cancel]
```

## Integration Layer

Centralize in `src/integrations/whatsapp/`:

- `WhatsappService.sendText(to, body)`
- `WhatsappService.sendButtons(to, body, buttons[])`
- `WhatsappService.sendCarousel(to, cards[])`
- Track `messageId` and delivery status for KPI (>95% delivery).

## Delivery & Retries

- Log send attempts with booking/customer ID.
- Retry transient failures (429, 5xx) with exponential backoff.
- Do not retry on invalid phone numbers — flag for staff review.

## Webhook Handling

Incoming button replies route back to the originating stage service via a dispatcher that maps `button_id` → handler.
