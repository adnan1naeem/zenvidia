---
name: implement-automation-stage
description: >-
  Implements one of the five ZenVida WhatsApp automation stages in NestJS.
  Use when adding or modifying Stage 1–5 flows, booking triggers, deposit
  collection, reminders, upselling, or post-visit follow-up.
---

# Implement Automation Stage

## Before Starting

1. Read `overview.md` for the target stage's trigger, flow, and messages.
2. Check `claude/rules/automation-stages.md` for condensed requirements.
3. Identify integrations needed: Mindbody, Stripe, WhatsApp, or scheduler.

## Implementation Checklist

```
- [ ] Create module under src/stages/stage-N-<name>/
- [ ] Define trigger (webhook, cron, or event handler)
- [ ] Add DTOs with class-validator for inbound payloads
- [ ] Implement service logic (extract booking data, call integrations)
- [ ] Add message templates matching overview.md wording
- [ ] Wire module into AppModule
- [ ] Handle idempotency for webhook-triggered stages
- [ ] Add unit tests for service logic
```

## Per-Stage Notes

| Stage          | Trigger type                  | Key integrations                            |
| -------------- | ----------------------------- | ------------------------------------------- |
| 1 Confirmation | Mindbody webhook              | Stripe (deposit link), WhatsApp             |
| 2 Deposit      | Stripe webhook + 6h cron      | Mindbody update, WhatsApp                   |
| 3 Reminders    | Cron (24h batch, 2h per-appt) | WhatsApp                                    |
| 4 Upselling    | Cron (3 days before)          | Mindbody history, Stripe, WhatsApp carousel |
| 5 Follow-up    | Mindbody status webhook       | WhatsApp (+2h delayed job)                  |

## Module Template

```typescript
@Module({
  imports: [MindbodyModule, StripeModule, WhatsappModule],
  controllers: [StageNController], // only if webhooks
  providers: [StageNService],
  exports: [StageNService],
})
export class StageNModule {}
```

## Message Content

Use exact tone from `overview.md` — warm, concise, emoji sparingly (🧘 in thank-you only). Always include studio address in reminders.

## Testing

- Mock external APIs in unit tests.
- Test timing edge cases: timezone boundaries, already-paid deposits, cancelled bookings.
