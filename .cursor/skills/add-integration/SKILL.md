---
name: add-integration
description: >-
  Adds or extends third-party integrations (Mindbody, Stripe, WhatsApp) in the
  NestJS project. Use when wiring APIs, webhooks, OAuth, or payment flows.
---

# Add Integration

## Module Structure

```
src/integrations/<name>/
  <name>.module.ts
  <name>.service.ts
  <name>.controller.ts   # webhook endpoints only
  dto/
  <name>.types.ts
```

Register in `AppModule` and export service for stage modules.

## Environment Variables

Add to `.env.example` (never commit `.env`):

```
MINDBODY_API_KEY=
MINDBODY_SITE_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
```

Load via `@nestjs/config` — access through `ConfigService`, not `process.env` directly in services.

## Mindbody

- **Inbound:** Webhook on new booking and appointment status change.
- **Outbound:** Mark deposit paid, add add-on services, read booking history.
- Map Mindbody client/appointment IDs to internal records.

## Stripe

- **Payment Links:** Create for deposit and add-on charges; store `payment_link_id` on booking.
- **Webhooks:** `checkout.session.completed` → Stage 2 handler.
- Verify signature with `STRIPE_WEBHOOK_SECRET`.

## WhatsApp (Meta Cloud API)

- **Outbound:** Graph API `POST /{phone-number-id}/messages`.
- **Inbound:** Webhook for messages and button replies; GET verification challenge.
- Verify `X-Hub-Signature-256` on inbound payloads.

## Webhook Controller Pattern

```typescript
@Post('webhook')
async handleWebhook(@Req() req: RawBodyRequest<Request>) {
  // 1. Verify signature
  // 2. Check idempotency key
  // 3. Dispatch to service
  // 4. Return 200 immediately
}
```

## Security Checklist

- [ ] Signature verification on all inbound webhooks
- [ ] Secrets in env only
- [ ] Rate limiting on public endpoints
- [ ] No PII in logs (mask phone numbers)
