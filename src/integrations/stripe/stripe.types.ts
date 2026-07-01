export interface DepositCheckoutParams {
  bookingId: string;
  customerPhone: string;
  serviceName: string;
  appointmentDate: string;
  amountCents: number;
  currency: string;
  customerEmail?: string;
}

export interface AddonCheckoutParams {
  bookingId: string;
  customerPhone: string;
  addonName: string;
  amountCents: number;
  currency: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}
