-- ============================================================
-- VIGÍA 360 — Script completo de migración
-- Ejecutar en Supabase SQL Editor (es seguro ejecutar más de una vez)
-- ============================================================

-- ── 1. Columnas del Responsable SST en vigia_empresas ────────
ALTER TABLE vigia_empresas
  ADD COLUMN IF NOT EXISTS resp_nombre           text,
  ADD COLUMN IF NOT EXISTS resp_licencia         text,
  ADD COLUMN IF NOT EXISTS resp_nivel_educativo  text,
  ADD COLUMN IF NOT EXISTS resp_experiencia_anios int,
  ADD COLUMN IF NOT EXISTS resp_cert50h_url      text,
  ADD COLUMN IF NOT EXISTS resp_cert50h_fecha    date,
  ADD COLUMN IF NOT EXISTS resp_cert20h_url      text,
  ADD COLUMN IF NOT EXISTS resp_cert20h_fecha    date,
  ADD COLUMN IF NOT EXISTS resp_firma_b64        text;

-- ── 2. Tabla de enlaces de documentos (Política, Objetivos, etc.) ─
CREATE TABLE IF NOT EXISTS vigia_doc_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  codigo      text NOT NULL,
  url         text NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_doc_links_empresa ON vigia_doc_links(empresa_id);

-- ── 3. Emergencias (Est. 5.1.1 + 5.1.2) ─────────────────────
CREATE TABLE IF NOT EXISTS vigia_emergencias_plan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  amenaza       text NOT NULL,
  nivel_riesgo  text NOT NULL DEFAULT 'MEDIO',
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
  tipo          text NOT NULL,
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
  tipo_brigada  text NOT NULL,
  fecha_ingreso date,
  cert_url      text,
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── 4. COPASST + Comité de Convivencia (Est. 1.1.6–1.1.8) ───
CREATE TABLE IF NOT EXISTS vigia_copasst_miembro (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo          text NOT NULL,
  rol           text NOT NULL,
  cargo_copasst text NOT NULL,
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
  tipo          text NOT NULL DEFAULT 'COPASST',
  numero        int,
  fecha         date NOT NULL,
  temas         text,
  compromisos   text,
  asistentes    text,
  url_acta      text,
  created_at    timestamptz DEFAULT now()
);

-- ── 5. Acciones de Mejoramiento (Est. 7.1.1–7.1.4) ──────────
CREATE TABLE IF NOT EXISTS vigia_mejoramiento (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  tipo           text NOT NULL DEFAULT 'CORRECTIVA',
  fuente         text NOT NULL,
  descripcion    text NOT NULL,
  causa_raiz     text,
  accion         text NOT NULL,
  responsable    text,
  fecha_limite   date,
  estado         text NOT NULL DEFAULT 'ABIERTA',
  eficacia       text,
  cerrada_en     date,
  evidencia_url  text,
  origen_ref_id  uuid,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ── 6. Auditoría Interna (Est. 6.1.2–6.1.4) ─────────────────
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

-- ── 7. Inspecciones (Est. 4.2.4) ─────────────────────────────
CREATE TABLE IF NOT EXISTS vigia_inspeccion (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  fecha          date NOT NULL,
  area           text NOT NULL,
  inspector      text NOT NULL,
  participo_copasst boolean DEFAULT false,
  tipo           text DEFAULT 'GENERAL',
  hallazgos      text,
  acciones       text,
  estado         text DEFAULT 'ABIERTA',
  evidencia_url  text,
  created_at     timestamptz DEFAULT now()
);

-- ── 8. Mantenimiento (Est. 4.2.5) ────────────────────────────
CREATE TABLE IF NOT EXISTS vigia_mantenimiento (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  equipo         text NOT NULL,
  tipo           text DEFAULT 'PREVENTIVO',
  frecuencia     text,
  fecha          date NOT NULL,
  responsable    text,
  estado         text DEFAULT 'PENDIENTE',
  observaciones  text,
  proxima_fecha  date,
  created_at     timestamptz DEFAULT now()
);

-- ── 9. Perfil de Salud / Sociodemográfico (Est. 3.1.1–3.1.9) ─
CREATE TABLE IF NOT EXISTS vigia_perfil_salud (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio                 int NOT NULL,
  total_trabajadores   int,
  promedio_edad        numeric(5,1),
  pct_masculino        numeric(5,1),
  pct_femenino         numeric(5,1),
  pct_primaria         numeric(5,1),
  pct_bachillerato     numeric(5,1),
  pct_tecnico          numeric(5,1),
  pct_universitario    numeric(5,1),
  dx_principales       text,
  ausentismo_dias      int,
  pve_riesgo1          text,
  pve_estado1          text,
  pve_riesgo2          text,
  pve_estado2          text,
  pve_riesgo3          text,
  pve_estado3          text,
  programa_estilos_url text,
  mediciones_url       text,
  planilla_ss_url      text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(empresa_id, anio)
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_emergencias_plan_empresa     ON vigia_emergencias_plan(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emergencias_simulacro_empresa ON vigia_emergencias_simulacro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_brigada_empresa              ON vigia_brigada_miembro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_copasst_miembro_empresa      ON vigia_copasst_miembro(empresa_id);
CREATE INDEX IF NOT EXISTS idx_copasst_acta_empresa         ON vigia_copasst_acta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mejoramiento_empresa         ON vigia_mejoramiento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa            ON vigia_auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inspeccion_empresa           ON vigia_inspeccion(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_empresa        ON vigia_mantenimiento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfil_salud_empresa         ON vigia_perfil_salud(empresa_id);

-- ── 10. Ausentismo laboral (Res. 0312 Est. 6.1.1 · Decreto 1072 Art. 2.2.4.6.21) ─
CREATE TABLE IF NOT EXISTS vigia_ausentismo (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  empleado_id     uuid REFERENCES vigia_empleados(id) ON DELETE SET NULL,
  nombre_empleado text,
  cargo           text,
  area            text,
  tipo            text NOT NULL DEFAULT 'ENFERMEDAD_GENERAL',
  fecha_inicio    date NOT NULL,
  fecha_fin       date NOT NULL,
  dias_perdidos   int  NOT NULL DEFAULT 1,
  con_incapacidad boolean DEFAULT false,
  diagnostico     text,
  observaciones   text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ausentismo_empresa ON vigia_ausentismo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ausentismo_fecha   ON vigia_ausentismo(empresa_id, fecha_inicio);

-- ── 11. Datos mensuales SG-SST (AT, EL, Ausentismo, E-P-R por mes) ──────────────────
-- Permite ingresar los totales mensuales según el estándar SURA/Ministerio de Trabajo
-- Fórmulas: AT Severidad = (días_perdidos_AT + días_cargados_AT) / num_trabajadores × 100
--           AT Frecuencia = num_AT / num_trabajadores × 100
--           EL Prevalencia = (casos_nuevos_el + casos_antiguos_el) / promedio_trab × 100000
--           EL Incidencia = casos_nuevos_el / promedio_trab × 100000
--           Ausentismo = (días_laboral + días_común) / (num_trab × días_laborales) × 100
--           E-P-R = items_cumplidos / items_evaluar × 100
CREATE TABLE IF NOT EXISTS vigia_sgsst_mensual (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id               uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio                     int  NOT NULL,
  mes                      int  NOT NULL CHECK (mes BETWEEN 1 AND 12),
  -- Base
  num_trabajadores         int  NOT NULL DEFAULT 0,
  dias_laborales           int  NOT NULL DEFAULT 30,
  -- AT (Accidentes de Trabajo)
  num_at                   int  NOT NULL DEFAULT 0,
  dias_perdidos_at         int  NOT NULL DEFAULT 0,
  dias_cargados_at         int  NOT NULL DEFAULT 0,
  num_at_mortales          int  NOT NULL DEFAULT 0,
  -- EL (Enfermedad Laboral)
  casos_nuevos_el          int  NOT NULL DEFAULT 0,
  casos_antiguos_el        int  NOT NULL DEFAULT 0,
  -- Ausentismo (se complementa con vigia_ausentismo pero permite entrada directa)
  dias_ausencia_laboral    int  NOT NULL DEFAULT 0,
  dias_ausencia_comun      int  NOT NULL DEFAULT 0,
  -- E-P-R del SG-SST
  epr_estructura_cumplidos int  NOT NULL DEFAULT 0,
  epr_estructura_total     int  NOT NULL DEFAULT 0,
  epr_proceso_cumplidos    int  NOT NULL DEFAULT 0,
  epr_proceso_total        int  NOT NULL DEFAULT 0,
  epr_resultado_cumplidos  int  NOT NULL DEFAULT 0,
  epr_resultado_total      int  NOT NULL DEFAULT 0,
  observaciones            text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE(empresa_id, anio, mes)
);
CREATE INDEX IF NOT EXISTS idx_sgsst_mensual_empresa ON vigia_sgsst_mensual(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sgsst_mensual_periodo ON vigia_sgsst_mensual(empresa_id, anio, mes);

-- ── 12. Presupuesto SG-SST (Formato F006 Res. 0312 ítem 1.1.3) ───────────────────────
-- Ítems de presupuesto con valores proyectado/ejecutado por mes
-- grupos: GASTOS_PERSONAL · MEDICINA_PREVENTIVA · DOTACION_EPP
--         EQUIPOS_EMERGENCIA · OTROS_RECURSOS
CREATE TABLE IF NOT EXISTS vigia_presupuesto_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio        int  NOT NULL,
  grupo       text NOT NULL,
  nombre      text NOT NULL,
  beneficio   text,
  orden       int  NOT NULL DEFAULT 0,
  valores     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_presupuesto_empresa ON vigia_presupuesto_item(empresa_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_anio    ON vigia_presupuesto_item(empresa_id, anio);

-- Análisis y plan de acción del presupuesto
CREATE TABLE IF NOT EXISTS vigia_presupuesto_meta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES vigia_empresas(id) ON DELETE CASCADE,
  anio        int  NOT NULL,
  elaboro     text,
  reviso      text,
  analisis    text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(empresa_id, anio)
);
CREATE INDEX IF NOT EXISTS idx_presupuesto_meta_empresa ON vigia_presupuesto_meta(empresa_id);

-- ── 13. Columnas adicionales EPP entrega (Res. 2400/79, Decreto 1072 Art. 2.2.4.6.24) ─
-- Ejecutar solo si la tabla vigia_epp_entrega ya existe (migración incremental)
ALTER TABLE IF EXISTS vigia_epp_entrega
  ADD COLUMN IF NOT EXISTS area         text,
  ADD COLUMN IF NOT EXISTS motivo       text DEFAULT 'PRIMERA_ENTREGA',
  ADD COLUMN IF NOT EXISTS marca        text,
  ADD COLUMN IF NOT EXISTS jefe_directo text,
  ADD COLUMN IF NOT EXISTS condicion    text DEFAULT 'NUEVO';

SELECT 'Migración Vigía 360 completada exitosamente' AS resultado;
