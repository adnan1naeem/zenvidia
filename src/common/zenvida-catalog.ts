import { CategoryId } from '../database/enums/category-id.enum';
import { ServiceId } from '../database/enums/service-id.enum';

export interface ZenVidaService {
  /** Stable catalog key used in WhatsApp payloads and API search. */
  id: ServiceId;
  categoryId: CategoryId;
  title: string;
  description: string;
  priceCents: number;
  depositCents: number;
  durationMinutes: number;
  scheduledAt: string;
  currency: 'usd';
}

export interface ZenVidaCategory {
  id: CategoryId;
  name: string;
  services: ZenVidaService[];
}

export interface ZenVidaAddon {
  id: string;
  name: string;
  priceCents: number;
  currency: 'usd';
  forServiceIds: ServiceId[];
}

/** Services are stored in the `products` table — use ProductsService to load them. */
export const DUMMY_ADDONS: ZenVidaAddon[] = [
  {
    id: 'aromatherapy-enhancement',
    name: 'Aromatherapy Enhancement',
    priceCents: 2500,
    currency: 'usd',
    forServiceIds: [
      ServiceId.ReikiHealingSession,
      ServiceId.WellnessConsultation,
      ServiceId.GuidedMeditation,
    ],
  },
  {
    id: 'extended-session',
    name: 'Extended Session (+30 min)',
    priceCents: 4500,
    currency: 'usd',
    forServiceIds: [
      ServiceId.TibetanBowlSession,
      ServiceId.CrystalBowlHealing,
      ServiceId.ReikiHealingSession,
    ],
  },
  {
    id: 'take-home-crystal-kit',
    name: 'Take-Home Crystal Kit',
    priceCents: 3500,
    currency: 'usd',
    forServiceIds: [ServiceId.CrystalBowlHealing, ServiceId.NatalChartReading],
  },
  {
    id: 'session-recording',
    name: 'Session Recording',
    priceCents: 2000,
    currency: 'usd',
    forServiceIds: [
      ServiceId.NatalChartReading,
      ServiceId.YearAheadForecast,
      ServiceId.GuidedMeditation,
    ],
  },
];

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatServiceSlot(scheduledAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(new Date(scheduledAt));
}

export function getAddonById(addonId: string): ZenVidaAddon | undefined {
  return DUMMY_ADDONS.find((a) => a.id === addonId);
}

export function getAddonsForService(serviceId: ServiceId): ZenVidaAddon[] {
  return DUMMY_ADDONS.filter((a) => a.forServiceIds.includes(serviceId));
}
