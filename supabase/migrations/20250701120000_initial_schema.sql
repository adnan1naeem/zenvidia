-- ZenVida consolidated schema

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'customer');

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'booked',
  'unpaid',
  'failed',
  'expired'
);

CREATE TYPE category_id AS ENUM (
  'astrology-services',
  'private-sessions',
  'private-sound-healing',
  'private-reiki-healing-training',
  'recovery-suite',
  'reiki-level-3-training',
  'zenvida-on-the-move'
);

CREATE TYPE service_id AS ENUM (
  'natal-chart-reading',
  'compatibility-reading',
  'year-ahead-forecast',
  'wellness-consultation',
  'guided-meditation',
  'life-coaching',
  'tibetan-bowl-session',
  'crystal-bowl-healing',
  'gong-meditation',
  'reiki-healing-session',
  'reiki-level-1',
  'reiki-level-2',
  'infrared-sauna',
  'cold-plunge',
  'compression-therapy',
  'reiki-master-training',
  'reiki-teacher-cert',
  'mobile-yoga',
  'outdoor-meditation',
  'corporate-wellness'
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id service_id NOT NULL UNIQUE,
  category_id category_id NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  deposit_cents INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'customer',
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_phone_idx ON users (phone);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  status appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX appointments_user_product_status_idx
  ON appointments (user_id, product_id, status);

CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_customer_id TEXT,
  stripe_charge_id TEXT,
  amount INTEGER,
  currency VARCHAR(3),
  appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  payment_status TEXT,
  webhook_event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX transaction_history_appointment_idx
  ON transaction_history (appointment_id);

CREATE INDEX transaction_history_checkout_session_idx
  ON transaction_history (stripe_checkout_session_id);

CREATE INDEX transaction_history_user_idx ON transaction_history (user_id);

INSERT INTO products (
  service_id, category_id, title, description,
  price_cents, deposit_cents, duration_minutes, scheduled_at, currency
) VALUES
  ('natal-chart-reading', 'astrology-services', 'Natal Chart Reading', 'Personal birth-chart analysis covering life path, strengths, and current transits.', 12000, 3000, 60, '2026-07-05T10:00:00+02:00', 'usd'),
  ('compatibility-reading', 'astrology-services', 'Compatibility Reading', 'Synastry session for couples or partners exploring relationship dynamics.', 14000, 3500, 75, '2026-07-06T16:00:00+02:00', 'usd'),
  ('year-ahead-forecast', 'astrology-services', 'Year Ahead Forecast', 'Annual outlook with key themes, opportunities, and timing guidance.', 10000, 2500, 45, '2026-07-08T11:30:00+02:00', 'usd'),
  ('wellness-consultation', 'private-sessions', 'Wellness Consultation', 'One-on-one holistic health and lifestyle assessment with a personalized plan.', 15000, 3750, 60, '2026-07-05T14:00:00+02:00', 'usd'),
  ('guided-meditation', 'private-sessions', 'Guided Meditation', 'Private meditation tailored to stress relief, focus, or emotional balance.', 9000, 2250, 45, '2026-07-07T09:00:00+02:00', 'usd'),
  ('life-coaching', 'private-sessions', 'Life Coaching', 'Goal-setting and mindset coaching for clarity and sustainable change.', 18000, 4500, 90, '2026-07-09T17:00:00+02:00', 'usd'),
  ('tibetan-bowl-session', 'private-sound-healing', 'Tibetan Bowl Session', 'Immersive sound bath with Tibetan singing bowls for deep relaxation.', 11000, 2750, 60, '2026-07-05T18:00:00+02:00', 'usd'),
  ('crystal-bowl-healing', 'private-sound-healing', 'Crystal Bowl Healing', 'Crystal bowl frequencies aligned to chakra balancing and energy release.', 13000, 3250, 75, '2026-07-10T12:00:00+02:00', 'usd'),
  ('gong-meditation', 'private-sound-healing', 'Gong Meditation', 'Private gong meditation for nervous-system reset and inner stillness.', 12500, 3125, 60, '2026-07-11T19:30:00+02:00', 'usd'),
  ('reiki-healing-session', 'private-reiki-healing-training', 'Reiki Healing Session', 'Hands-on energy healing to restore balance, calm, and vitality.', 9500, 2375, 60, '2026-07-06T10:00:00+02:00', 'usd'),
  ('reiki-level-1', 'private-reiki-healing-training', 'Reiki Level 1', 'Foundational Reiki training with attunement, practice, and certification.', 25000, 6250, 180, '2026-07-12T09:00:00+02:00', 'usd'),
  ('reiki-level-2', 'private-reiki-healing-training', 'Reiki Level 2', 'Advanced symbols, distance healing, and practitioner-level techniques.', 32000, 8000, 240, '2026-07-19T09:00:00+02:00', 'usd'),
  ('infrared-sauna', 'recovery-suite', 'Infrared Sauna', 'Private infrared sauna for detox, muscle recovery, and circulation.', 6500, 1625, 45, '2026-07-05T11:00:00+02:00', 'usd'),
  ('cold-plunge', 'recovery-suite', 'Cold Plunge', 'Guided cold immersion for inflammation reduction and mental resilience.', 5500, 1375, 30, '2026-07-07T15:00:00+02:00', 'usd'),
  ('compression-therapy', 'recovery-suite', 'Compression Therapy', 'Normatec-style compression for lymphatic drainage and athletic recovery.', 7000, 1750, 45, '2026-07-08T13:00:00+02:00', 'usd'),
  ('reiki-master-training', 'reiki-level-3-training', 'Reiki Master Training', 'Master-level attunement, teaching methodology, and practitioner mastery.', 55000, 13750, 360, '2026-07-26T09:00:00+02:00', 'usd'),
  ('reiki-teacher-cert', 'reiki-level-3-training', 'Reiki Teacher Cert', 'Certification to teach and attune Reiki students at all levels.', 65000, 16250, 480, '2026-08-02T09:00:00+02:00', 'usd'),
  ('mobile-yoga', 'zenvida-on-the-move', 'Mobile Yoga Session', 'Private yoga at your home, hotel, or office anywhere in Madrid.', 20000, 5000, 60, '2026-07-06T08:00:00+02:00', 'usd'),
  ('outdoor-meditation', 'zenvida-on-the-move', 'Outdoor Meditation', 'Guided meditation in a scenic Madrid park or garden setting.', 12000, 3000, 60, '2026-07-13T07:30:00+02:00', 'usd'),
  ('corporate-wellness', 'zenvida-on-the-move', 'Corporate Wellness', 'On-site wellness pop-up for teams — breathwork, stretch, and reset.', 35000, 8750, 90, '2026-07-15T12:00:00+02:00', 'usd');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
