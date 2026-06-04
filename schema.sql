-- ============================================================
-- SENTIDO Marketplace — Esquema de Base de Datos
-- Ejecuta este script en: Supabase → SQL Editor → New query
-- ============================================================

-- Tabla 1: Solicitudes de registro (applications)
-- Recibe las postulaciones del formulario de registro
-- ============================================================
create table if not exists applications (
  id               uuid        default gen_random_uuid() primary key,

  -- Datos del emprendimiento
  name             text        not null,
  city             text,
  tagline          text,
  formal           text        default 'NO',
  category         text,
  seals            text        default '',

  -- Historia e impacto
  impact           text,
  why_sentido      text,
  photo_url        text,
  products         jsonb       default '[]'::jsonb,

  -- Datos del emprendedor
  owner_name       text,
  email            text,
  whatsapp         text,
  instagram        text,

  -- Estado de la solicitud
  status           text        default 'pending'
                               check (status in ('pending', 'approved', 'rejected')),

  -- Resultado del agente IA
  ai_score         integer,
  ai_recommendation text       check (ai_recommendation in ('APROBAR', 'REVISAR', 'RECHAZAR', null)),
  ai_justification text,
  ai_notes         text,
  ai_verified_seals text,
  ai_pending_seals  text,
  ai_rejected_seals text,

  -- Auditoría
  created_at       timestamptz default now(),
  reviewed_at      timestamptz
);

-- Tabla 2: Emprendedores aprobados (entrepreneurs)
-- Los que completan el onboarding aparecen en el marketplace
-- ============================================================
create table if not exists entrepreneurs (
  id               uuid        default gen_random_uuid() primary key,
  application_id   uuid        references applications(id),

  -- Perfil público
  name             text        not null,
  city             text,
  tagline          text,
  formal           text        default 'NO',
  seals            text        default '',
  impact           text,
  photo_url        text        default 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
  products         jsonb       default '[]'::jsonb,

  -- Contacto
  whatsapp         text,
  email            text,

  -- Flujo de onboarding
  onboarding_token uuid        default gen_random_uuid() unique,
  onboarding_complete boolean  default false,
  active           boolean     default true,

  -- Auditoría
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Applications
alter table applications enable row level security;

-- Cualquier visitante puede enviar una solicitud
create policy "public_insert_applications"
  on applications for insert
  with check (true);

-- Lectura permisiva para admin (MVP)
-- En producción: restringir con auth de admin
create policy "anon_select_applications"
  on applications for select using (true);

create policy "anon_update_applications"
  on applications for update using (true);

-- Entrepreneurs
alter table entrepreneurs enable row level security;

-- El marketplace puede leer emprendedores aprobados
create policy "public_read_entrepreneurs"
  on entrepreneurs for select
  using (active = true);

-- El admin puede insertar y actualizar (MVP permisivo)
create policy "anon_insert_entrepreneurs"
  on entrepreneurs for insert
  with check (true);

create policy "anon_update_entrepreneurs"
  on entrepreneurs for update using (true);

-- ============================================================
-- Vista útil para el admin: solicitudes con conteo
-- ============================================================
create or replace view applications_summary as
select
  status,
  count(*) as total,
  avg(ai_score) as avg_score
from applications
group by status;

-- ============================================================
-- FIN — Revisa en Table Editor que las tablas se crearon OK
-- ============================================================
