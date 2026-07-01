# ZenVida WhatsApp Automation

NestJS backend automating ZenVida (Madrid wellness studio) customer lifecycle via WhatsApp, Mindbody, and Stripe.

## Business Goal

Automate booking → deposit → reminders → upselling → post-visit follow-up so staff can focus on service delivery while reducing no-shows and increasing revenue.

## Tech Stack

- **Framework:** NestJS 11, TypeScript, class-validator
- **Integrations:** Mindbody (bookings), Stripe (deposits + add-ons), WhatsApp Business API
- **Scheduling:** `@nestjs/schedule` for cron-based stages
- **Config:** `.env` via `@nestjs/config` — never hardcode secrets

## The 5 Automation Stages

Read `overview.md` for full detail. Condensed:

1. **Confirmation** — Mindbody booking → Stripe deposit link → WhatsApp with Pay/Confirm/Cancel buttons
2. **Deposit** — Stripe payment updates Mindbody; unpaid reminders at 24h/48h; optional auto-cancel
3. **Reminders** — 24h batch + 2h per-appointment WhatsApp messages
4. **Upselling** — 3 days before: personalized add-on carousel based on service/history/season
5. **Follow-up** — Thank-you immediately; Google review link +2h after visit

## Code Conventions

### Module layout

```
src/
  stages/stage-N-<name>/     # One module per automation stage
  integrations/mindbody|stripe|whatsapp/
  common/scheduling|messaging/
```

### Patterns

- Idempotent webhook handlers with signature verification
- Deduplicate by external event ID
- Studio timezone: `Europe/Madrid`
- Exhaustive `switch` with `never` default for enums
- Spanish customer messages; English code comments
- Centralize WhatsApp sends in `integrations/whatsapp/`

### Commands

```bash
npm run start:dev    # Dev server (port 5000)
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run build        # Production build
```

## KPI Targets

| Metric             | Target |
| ------------------ | ------ |
| WhatsApp delivery  | > 95%  |
| No-show reduction  | 40–50% |
| Deposit within 48h | 100%   |
| Upsell conversion  | 15–20% |
| Review generation  | > 60%  |

## Agent Skills

Detailed workflows in `claude/skills/`:

- `implement-automation-stage` — Build or modify a stage module
- `whatsapp-messaging` — Message templates and interactive elements
- `add-integration` — Wire Mindbody, Stripe, or WhatsApp APIs

## Rules

Additional focused rules in `claude/rules/` mirror the Cursor rules in `cursor/rules/`.
