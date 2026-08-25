-- Ejecutar en Supabase > SQL Editor
ALTER TABLE axa_ordenes
  ADD COLUMN IF NOT EXISTS upr              TEXT,
  ADD COLUMN IF NOT EXISTS numero_afiliacion TEXT,
  ADD COLUMN IF NOT EXISTS nombre_contacto  TEXT,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT,
  ADD COLUMN IF NOT EXISTS cargo_contacto   TEXT,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS codigo_actividad  TEXT,
  ADD COLUMN IF NOT EXISTS ciudad_ejecucion  TEXT,
  ADD COLUMN IF NOT EXISTS cantidad          INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS valor_unitario    NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tecnico_arl       TEXT,
  ADD COLUMN IF NOT EXISTS consultor_asignado TEXT;
