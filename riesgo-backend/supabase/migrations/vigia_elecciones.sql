-- ============================================================
-- VIGÍA 360 — Módulo de Procesos Electorales COPASST / CCL
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

CREATE TABLE IF NOT EXISTS vigia_copasst_eleccion (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                 uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo                       text NOT NULL CHECK (tipo IN ('COPASST', 'CCL')),
  estado                     text NOT NULL DEFAULT 'CONVOCATORIA'
                               CHECK (estado IN ('CONVOCATORIA','CANDIDATOS','VOTACION','CONSTITUIDO')),

  -- ── Datos de la convocatoria ─────────────────────────────
  num_trabajadores           int,
  fecha_convocatoria         date,
  fecha_cierre_postulaciones date,
  fecha_votacion             date,
  hora_votacion              text,
  lugar_votacion             text,
  fecha_inicio_periodo       date,
  fecha_fin_periodo          date,

  -- ── Candidatos y representantes (JSONB) ─────────────────
  -- [{id, nombre, cedula, cargo, votos, resultado}]
  candidatos_trabajadores    jsonb NOT NULL DEFAULT '[]',
  -- [{id, nombre, cedula, cargo, rol_comite}]
  representantes_empleador   jsonb NOT NULL DEFAULT '[]',

  observaciones              text,
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eleccion_empresa ON vigia_copasst_eleccion(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eleccion_estado  ON vigia_copasst_eleccion(estado);
