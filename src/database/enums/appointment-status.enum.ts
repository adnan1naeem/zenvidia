export enum AppointmentStatus {
  Pending = 'pending',
  Booked = 'booked',
  Unpaid = 'unpaid',
  Failed = 'failed',
  Expired = 'expired',
}

/** Active checkout in progress — awaiting Stripe payment. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.Pending,
];
