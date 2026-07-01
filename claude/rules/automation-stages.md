# Automation Stages

## Stage 1 — Instant Appointment Confirmation

**Trigger:** New Mindbody booking.

Extract name, phone, service, date, time, price → generate Stripe deposit link → send WhatsApp with Pay Deposit / Confirm / Cancel buttons → schedule Stage 3 reminders.

## Stage 2 — Deposit Collection

**Trigger:** Stripe payment OR unpaid booking check (every 6h).

- **Paid:** Update Mindbody deposit status → thank-you WhatsApp.
- **Unpaid:** Reminder at 24h and 48h after booking. Optionally auto-cancel if unpaid within 24h of appointment.

## Stage 3 — Appointment Reminders

**Trigger:** Time-based.

- **24h before:** Daily batch for next-day appointments (service, time, studio address).
- **2h before:** Per-appointment message.

## Stage 4 — Smart Upselling

**Trigger:** 3 days before appointment.

Match current service + history + season → send carousel with quick-reply buttons → on accept: add to Mindbody, Stripe link for add-on, confirm via WhatsApp.

Example mappings: Classic Massage → Hot Stone (+€25); Reflexology → Facial (+€35); weekends → Premium Package; summer → Beach Getaway Bundle.

## Stage 5 — Post-Visit Follow-Up

**Trigger:** Staff marks appointment done in Mindbody.

- **Immediately:** Thank-you message.
- **+2h:** Google review request with direct link.

## Customer Journey Summary

Book → confirm + deposit → pay (with reminders) → 24h & 2h reminders → upsell 3 days prior → post-visit thank-you + review request.
