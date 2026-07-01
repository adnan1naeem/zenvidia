# PROJECT OVERVIEW – ZenVida WhatsApp Automation

## 1. Business Context

ZenVida is a wellness and beauty studio in Madrid. Their customers book appointments (massages, reflexology, facials, etc.) through Mindbody. Currently, staff manually send reminders, chase deposits, and follow up after visits – which is time‑consuming and leads to missed revenue.

**The Goal:** Automate the entire customer lifecycle via WhatsApp, from booking to post‑visit re‑engagement, so the studio can focus on delivering great service while increasing revenue and reducing no‑shows.

---

## 2. The 5 Automation Stages (End‑to‑End Flow)

The customer journey is divided into **5 stages**, each triggering automatically based on customer actions or time.

---

### Stage 1 – Instant Appointment Confirmation

**Trigger:** Customer books an appointment in Mindbody.

**Flow:**

1. System receives the new booking instantly.
2. It extracts: customer name, phone number, service type, date, time, and price.
3. A **Stripe payment link** is generated for a deposit.
4. A WhatsApp message is sent to the customer:
   - Confirms their appointment details (date, time, location).
   - Includes a **"Pay Deposit"** button linking to Stripe.
   - Also includes **"Confirm"** and **"Cancel"** buttons for quick responses.
5. The system schedules two automatic reminders (see Stage 3).

---

### Stage 2 – Deposit Collection & Tracking

**Trigger:** Customer clicks the payment link OR the system detects an unpaid booking.

**Flow (success):**

1. Customer pays the deposit via Stripe.
2. System receives the payment confirmation.
3. Mindbody is updated to mark the deposit as paid.
4. A thank‑you WhatsApp message is sent: _"Deposit received. See you on [date]!"_

**Flow (unpaid / no action):**

1. Every 6 hours, the system checks for bookings that are still unpaid.
2. **24 hours after booking:** A reminder is sent – _"Your deposit link is ready. Click here to pay."_
3. **48 hours after booking:** A final reminder – _"Last chance: complete your deposit to secure your booking."_
4. Optionally, if still unpaid within 24 hours of the appointment, the booking is **auto‑cancelled** to free up the slot.

---

### Stage 3 – Scheduled Appointment Reminders

**Trigger:** Time‑based (24 hours and 2 hours before the appointment).

**24‑Hour Reminder:**

- Sent once per day for all appointments happening the next day.
- Message: _"Reminder: Your [service] is tomorrow at [time]. See you at the studio!"_
- Includes the studio address.

**2‑Hour Reminder:**

- Sent exactly 2 hours before the appointment start time.
- Message: _"Your appointment is in 2 hours! We're ready for you."

---

### Stage 4 – Smart Upselling Offers

**Trigger:** 3 days before the appointment.

**Flow:**

1. System checks the customer's booking history (past services).
2. Based on the **current service** and **seasonal factors**, it selects a relevant add‑on:
   - _Classic Massage_ → Hot Stone add‑on (+€25)
   - _Reflexology_ → Facial Massage (+€35) or Couples Package
   - _Weekend appointments_ → Premium Package
   - _Summer months_ → Beach Getaway Bundle
3. A personalised WhatsApp message is sent with **image carousels** and **quick‑reply buttons** for each offer.
4. If the customer clicks an offer, the system:
   - Adds the extra service to their Mindbody booking.
   - Sends a new Stripe payment link for the add‑on.
   - Confirms the upgrade via WhatsApp.

---

### Stage 5 – Post‑Visit Follow‑Up

**Trigger:** Appointment completion (staff marks it as "done" in Mindbody).

**Timeline of automated messages:**

| Time After Visit  | Action                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Immediately**   | Send a thank‑you message: _"We hope you loved your [service]! Your wellbeing matters 🧘"_ |
| **2 hours later** | Request a Google review: _"Share your experience – here's your direct review link."_      |

---

## 3. The Complete Customer Journey (Summary)

1. **Books** → gets instant confirmation + deposit link.
2. **Pays** deposit within 48h (or gets reminders).
3. **Receives** 24h & 2h reminders before the visit.
4. **Gets** a personalised upsell offer 3 days before.
5. **After visit** → receives thank‑you, review request, rebooking offer, and referral incentive over the next week.

Everything is fully automated, hands‑off for staff, and happens via WhatsApp – the customer's preferred channel.

---

## 4. Success Measurement (KPIs)

| Metric                         | Target |
| ------------------------------ | ------ |
| WhatsApp message delivery rate | > 95%  |
| No‑show reduction              | 40‑50% |
| Deposit collection within 48h  | 100%   |
| Upsell conversion rate         | 15‑20% |
| Review generation rate         | > 60%  |
| Repeat booking increase        | 25‑35% |
