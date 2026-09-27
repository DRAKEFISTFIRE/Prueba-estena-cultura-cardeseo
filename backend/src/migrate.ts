import { pool } from "./db.js";

const sql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  code_last4 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','used','revoked','expired')),
  tutor_id UUID REFERENCES tutors(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS registration_codes_status_idx
ON registration_codes(status);

-- venues DEBE crearse antes que activities, porque activities
-- referencia venues(id) con una foreign key.
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  ticketing_provider TEXT NOT NULL DEFAULT 'internal'
    CHECK (ticketing_provider IN ('internal','onebox','koobin','janto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  title_ca TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_ca TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL,
  discipline TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  remaining INTEGER NOT NULL CHECK (remaining >= 0),
  provider TEXT NOT NULL,
  provider_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, external_id)
);

-- CREATE TABLE IF NOT EXISTS no modifica una tabla que ya existe de
-- una ejecución anterior. Este ALTER añade venue_id si te faltaba.
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  activity_id UUID NOT NULL REFERENCES activities(id),
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','failed')),
  quantity INTEGER NOT NULL DEFAULT 2 CHECK (quantity = 2),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_reservation_id TEXT,
  pass_jti TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS venue_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL UNIQUE REFERENCES venues(id),
  provider TEXT NOT NULL CHECK (provider IN ('internal','onebox','koobin','janto','redirect')),
  base_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none','api_key','basic','oauth2')),
  credentials_encrypted BYTEA,
  reserve_endpoint TEXT,
  confirm_endpoint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','testing','active','disabled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La columna "token" guarda el JWT completo del pase, no solo la firma,
-- para poder regenerar el QR desde /v1/reservations/:id/pass.
-- Pendiente: cifrar esta columna en reposo antes de producción (RGPD/ENS).
CREATE TABLE IF NOT EXISTS passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id),
  jti TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE passes
  ADD COLUMN IF NOT EXISTS token TEXT NOT NULL DEFAULT '';

ALTER TABLE tutors
  ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  entry_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION prevent_ledger_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_immutable_update ON ledger_entries;

CREATE TRIGGER ledger_immutable_update
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_update();

CREATE OR REPLACE FUNCTION prevent_audit_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_immutable_update ON audit_log;

CREATE TRIGGER audit_immutable_update
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();


/*
 * LIMPIEZA DE DATOS LOCALES
 *
 * Borra todos los usuarios creados y todos los datos
 * dependientes de ellos.
 *
 * NO borra la estructura de las tablas.
 */
TRUNCATE TABLE
  audit_log,
  ledger_entries,
  passes,
  reservations,
  registration_codes,
  tutors,
  activities,
  venues
RESTART IDENTITY CASCADE;


/*
 * VENUES + ACTIVIDADES DE PRUEBA
 *
 * provider = 'internal': es el único adaptador de taquilla funcional
 * hoy. Las fechas van casteadas explícitamente a ::timestamptz porque
 * dentro de un UNION ALL, PostgreSQL resuelve los literales de fecha
 * como texto puro y ya no los convierte automáticamente.
 */

WITH v AS (
  INSERT INTO venues (name, district, ticketing_provider) VALUES
    ('Teatre Nacional de Catalunya', 'Eixample', 'internal'),
    ('Mercat de les Flors', 'Sants-Montjuïc', 'internal'),
    ('Auditori de Barcelona', 'Eixample', 'internal'),
    ('CCCB', 'Ciutat Vella', 'internal'),
    ('Filmoteca de Catalunya', 'Ciutat Vella', 'internal'),
    ('CosmoCaixa Barcelona', 'Sarrià-Sant Gervasi', 'internal'),
    ('Teatre Lliure', 'Gràcia', 'internal'),
    ('Teatre Romea', 'Ciutat Vella', 'internal')
  RETURNING id, name
)
INSERT INTO activities (
  external_id, venue_id, venue_name, title_ca, title_es,
  description_ca, description_es, district, discipline,
  starts_at, ends_at, capacity, remaining, provider, provider_url, status
)
SELECT 'demo-teatre-001', v.id, v.name,
  'La plaça del Diamant', 'La plaza del Diamante',
  'Una proposta teatral basada en el clàssic de Mercè Rodoreda.',
  'Una propuesta teatral basada en el clásico de Mercè Rodoreda.',
  'Eixample', 'Teatre',
  '2026-10-03 19:30:00+02'::timestamptz, '2026-10-03 21:30:00+02'::timestamptz,
  120, 120, 'internal', 'https://example.com/teatre', 'published'
FROM v WHERE v.name = 'Teatre Nacional de Catalunya'
UNION ALL
SELECT 'demo-dansa-001', v.id, v.name,
  'Cos i moviment', 'Cuerpo y movimiento',
  'Espectacle contemporani de dansa i moviment.',
  'Espectáculo contemporáneo de danza y movimiento.',
  'Sants-Montjuïc', 'Dansa',
  '2026-10-10 20:00:00+02'::timestamptz, '2026-10-10 21:30:00+02'::timestamptz,
  80, 80, 'internal', 'https://example.com/dansa', 'published'
FROM v WHERE v.name = 'Mercat de les Flors'
UNION ALL
SELECT 'demo-musica-001', v.id, v.name,
  'Concert de tardor', 'Concierto de otoño',
  'Concert de música clàssica amb repertori de tardor.',
  'Concierto de música clásica con repertorio de otoño.',
  'Eixample', 'Música',
  '2026-10-17 19:00:00+02'::timestamptz, '2026-10-17 21:00:00+02'::timestamptz,
  200, 200, 'internal', 'https://example.com/musica', 'published'
FROM v WHERE v.name = 'Auditori de Barcelona'
UNION ALL
SELECT 'demo-expo-001', v.id, v.name,
  'Art i ciutat', 'Arte y ciudad',
  'Exposició dedicada a la relació entre art, ciutat i societat.',
  'Exposición dedicada a la relación entre arte, ciudad y sociedad.',
  'Ciutat Vella', 'Exposició',
  '2026-10-24 11:00:00+02'::timestamptz, '2026-10-24 18:00:00+02'::timestamptz,
  300, 300, 'internal', 'https://example.com/exposicio', 'published'
FROM v WHERE v.name = 'CCCB'
UNION ALL
SELECT 'demo-cinema-001', v.id, v.name,
  'Cinema europeu', 'Cine europeo',
  'Sessió especial de cinema europeu contemporani.',
  'Sesión especial de cine europeo contemporáneo.',
  'Ciutat Vella', 'Cinema',
  '2026-10-30 18:30:00+01'::timestamptz, '2026-10-30 20:30:00+01'::timestamptz,
  100, 100, 'internal', 'https://example.com/cinema', 'published'
FROM v WHERE v.name = 'Filmoteca de Catalunya'
UNION ALL
SELECT 'demo-familia-001', v.id, v.name,
  'Ciència per a tothom', 'Ciencia para todos',
  'Activitat cultural i científica per a famílies.',
  'Actividad cultural y científica para familias.',
  'Sarrià-Sant Gervasi', 'Família',
  '2026-11-07 12:00:00+01'::timestamptz, '2026-11-07 13:30:00+01'::timestamptz,
  60, 60, 'internal', 'https://example.com/ciencia', 'published'
FROM v WHERE v.name = 'CosmoCaixa Barcelona'
UNION ALL
SELECT 'demo-dansa-002', v.id, v.name,
  'Nit de dansa contemporània', 'Noche de danza contemporánea',
  'Diferents peces de dansa contemporània.',
  'Diferentes piezas de danza contemporánea.',
  'Gràcia', 'Dansa',
  '2026-11-14 20:00:00+01'::timestamptz, '2026-11-14 22:00:00+01'::timestamptz,
  90, 90, 'internal', 'https://example.com/dansa-2', 'published'
FROM v WHERE v.name = 'Teatre Lliure'
UNION ALL
SELECT 'demo-teatre-002', v.id, v.name,
  'Històries de Barcelona', 'Historias de Barcelona',
  'Una obra teatral inspirada en històries de la ciutat.',
  'Una obra teatral inspirada en historias de la ciudad.',
  'Ciutat Vella', 'Teatre',
  '2026-11-21 19:30:00+01'::timestamptz, '2026-11-21 21:30:00+01'::timestamptz,
  140, 140, 'internal', 'https://example.com/barcelona', 'published'
FROM v WHERE v.name = 'Teatre Romea';
`;

await pool.query(sql);
await pool.end();

console.log("Database migrated and demo data loaded.");