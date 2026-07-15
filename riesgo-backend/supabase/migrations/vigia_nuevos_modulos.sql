-- ============================================================
-- VIGÍA — Nuevos módulos Res. 0312/2019
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── Emergencias (5.1.1 + 5.1.2) ──────────────────────────
CREATE TABLE IF NOT EXISTS vigia_emergencias_plan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  amenaza       text NOT NULL,              -- sismo, incendio, etc.
  nivel_riesgo  text NOT NULL DEFAULT 'MEDIO', -- ALTO/MEDIO/BAJO
  probabilidad  text,
  impacto       text,
  medidas       text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vigia_emergencias_simulacro (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  fecha         date NOT NULL,
  tipo          text NOT NULL,             -- evacuacion, contraincendios, primeros auxilios
  duracion_min  int,
  participantes int,
  resultado     text,
  observaciones text,
  evidencia_url text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vigia_brigada_miembro (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  empleado_id   uuid REFERENCES vigia_empleados(id) ON DELETE SET NULL,
  nombre        text NOT NULL,
  cargo         text,
  tipo_brigada  text NOT NULL,             -- PRIMEROS_AUXILIOS / CONTRAINCENDIOS / EVACUACION / COMUNICACIONES
  fecha_ingreso date,
  cert_url      text,
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── COPASST + Comité de Convivencia (1.1.6–1.1.8) ────────
CREATE TABLE IF NOT EXISTS vigia_copasst_miembro (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo          text NOT NULL,             -- COPASST / CCL
  rol           text NOT NULL,             -- EMPLEADOR / TRABAJADOR
  cargo_copasst text NOT NULL,             -- PRESIDENTE/SECRETARIO/VOCAL/SUPLENTE
  nombre        text NOT NULL,
  cedula        text,
  cargo_empresa text,
  fecha_inicio  date,
  fecha_fin     date,
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vigia_copasst_acta (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo          text NOT NULL DEFAULT 'COPASST', -- COPASST / CCL
  numero        int,
  fecha         date NOT NULL,
  temas         text,
  compromisos   text,
  asistentes    text,
  url_acta      text,
  created_at    timestamptz DEFAULT now()
);

-- ── Acciones de Mejoramiento (7.1.1–7.1.4) ───────────────
CREATE TABLE IF NOT EXISTS vigia_mejoramiento (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo           text NOT NULL DEFAULT 'CORRECTIVA', -- CORRECTIVA / PREVENTIVA / MEJORA
  fuente         text NOT NULL,                       -- AUDITORIA / INSPECCION / AT / COPASST / ARL / OTRO
  descripcion    text NOT NULL,
  causa_raiz     text,
  accion         text NOT NULL,
  responsable    text,
  fecha_limite   date,
  estado         text NOT NULL DEFAULT 'ABIERTA',     -- ABIERTA / EN_PROCESO / CERRADA / VENCIDA
  eficacia       text,                                -- resultado verificación eficacia
  cerrada_en     date,
  evidencia_url  text,
  origen_ref_id  uuid,                                -- referencia a investigacion/inspeccion si aplica
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ── Auditoría Interna (6.1.2–6.1.4) ─────────────────────
CREATE TABLE IF NOT EXISTS vigia_auditoria (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio            int NOT NULL,
  auditor         text NOT NULL,
  fecha_plan      date,
  fecha_ejecucion date,
  alcance         text,
  metodologia     text,
  hallazgos       text,
  oportunidades   text,
  conclusion      text,
  comunicado_copasst boolean DEFAULT false,
  informe_url     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── Inspecciones a instalaciones (4.2.4) ─────────────────
CREATE TABLE IF NOT EXISTS vigia_inspeccion (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  fecha          date NOT NULL,
  area           text NOT NULL,
  inspector      text NOT NULL,
  participo_copasst boolean DEFAULT false,
  tipo           text DEFAULT 'GENERAL',  -- GENERAL / EQUIPOS / EPP / EMERGENCIA
  hallazgos      text,
  acciones       text,
  estado         text DEFAULT 'ABIERTA',  -- ABIERTA / CERRADA
  evidencia_url  text,
  created_at     timestamptz DEFAULT now()
);

-- ── Mantenimiento periódico (4.2.5) ──────────────────────
CREATE TABLE IF NOT EXISTS vigia_mantenimiento (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  equipo         text NOT NULL,
  tipo           text DEFAULT 'PREVENTIVO',  -- PREVENTIVO / CORRECTIVO
  frecuencia     text,                       -- MENSUAL / TRIMESTRAL / SEMESTRAL / ANUAL
  fecha          date NOT NULL,
  responsable    text,
  estado         text DEFAULT 'PENDIENTE',   -- PENDIENTE / REALIZADO
  observaciones  text,
  proxima_fecha  date,
  created_at     timestamptz DEFAULT now()
);

-- ── Perfil sociodemográfico (3.1.1) ──────────────────────
-- Computed from vigia_empleados — no separate table needed.
-- Stored as a snapshot for the report:
CREATE TABLE IF NOT EXISTS vigia_perfil_salud (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio            int NOT NULL,
  -- Sociodemográfico
  total_trabajadores   int,
  promedio_edad        numeric(5,1),
  pct_masculino        numeric(5,1),
  pct_femenino         numeric(5,1),
  pct_primaria         numeric(5,1),
  pct_bachillerato     numeric(5,1),
  pct_tecnico          numeric(5,1),
  pct_universitario    numeric(5,1),
  -- Condiciones de salud
  dx_principales       text,    -- JSON array or text
  ausentismo_dias      int,
  -- PVE / Programas de vigilancia epidemiológica
  pve_riesgo1          text,
  pve_estado1          text,
  pve_riesgo2          text,
  pve_estado2          text,
  pve_riesgo3          text,
  pve_estado3          text,
  -- Estilos saludables
  programa_estilos_url text,
  -- Mediciones ambientales (4.1.4)
  mediciones_url       text,
  -- Seguridad social (1.1.4)
  planilla_ss_url      text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(empresa_id, anio)
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_emergencias_plan_empresa ON vigia_emergencias_plan(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emergencias_simulacro_empresa ON vigia_emergencias_simulacro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_brigada_empresa ON vigia_brigada_miembro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_copasst_miembro_empresa ON vigia_copasst_miembro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_copasst_acta_empresa ON vigia_copasst_acta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mejoramiento_empresa ON vigia_mejoramiento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON vigia_auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inspeccion_empresa ON vigia_inspeccion(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_empresa ON vigia_mantenimiento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfil_salud_empresa ON vigia_perfil_salud(empresa_id);

-- ── Columnas adicionales en vigia_empresas ────────────────
-- Documentos clave (Política, Objetivos, Matriz Legal, etc.)
-- Se manejan por vigia_doc_links con códigos específicos:
-- DOC-POLITICA-SST, DOC-OBJETIVOS-SST, DOC-MATRIZ-LEGAL,
-- DOC-COMUNICACION, DOC-CAMBIO, DOC-COMPRAS, DOC-PROVEEDORES,
-- DOC-PRESUPUESTO-SST, DOC-PLANILLA-SS, DOC-RENDICION-CUENTAS,
-- DOC-PMIRS, DOC-ESTILOS-SALUDABLES, DOC-CUSTODIA-HC

SELECT 'Migración completada exitosamente' as resultado;
