-- Módulo Control de Fuego — RIESGO! · FORBE SAS
-- Ejecutar en Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS extintores (
  id               SERIAL PRIMARY KEY,
  empresa          TEXT NOT NULL,
  sede             TEXT,
  ubicacion        TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  clases_fuego     TEXT,
  capacidad        TEXT,
  codigo           TEXT,
  fecha_vencimiento       DATE,
  fecha_ultima_recarga    DATE,
  estado           TEXT NOT NULL DEFAULT 'Activo',
  observaciones    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspecciones_extintor (
  id               SERIAL PRIMARY KEY,
  extintor_id      INTEGER NOT NULL REFERENCES extintores(id) ON DELETE CASCADE,
  fecha_inspeccion DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector        TEXT,
  -- Checklist NTC 2885
  ubicacion_correcta  BOOLEAN NOT NULL DEFAULT true,
  sin_obstrucciones   BOOLEAN NOT NULL DEFAULT true,
  manometro_ok        BOOLEAN NOT NULL DEFAULT true,
  sello_ok            BOOLEAN NOT NULL DEFAULT true,
  pin_ok              BOOLEAN NOT NULL DEFAULT true,
  manguera_ok         BOOLEAN NOT NULL DEFAULT true,
  etiquetas_ok        BOOLEAN NOT NULL DEFAULT true,
  cilindro_ok         BOOLEAN NOT NULL DEFAULT true,
  -- Resultado
  resultado        TEXT NOT NULL DEFAULT 'Aprobado',
  observaciones    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
