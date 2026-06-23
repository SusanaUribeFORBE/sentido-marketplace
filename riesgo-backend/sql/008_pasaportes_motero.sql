-- Pasaporte de Movilidad Segura: perfil persistente por motociclista (cédula),
-- que acumula puntos e insignias entre varias jugadas del Reto del Motero Auteco
-- (a diferencia de control_pins, que es de un solo uso y se "quema" al jugar).

create table if not exists pasaportes_motero (
  id uuid default gen_random_uuid() primary key,
  cedula text not null unique,
  nombre text not null,
  celular text,
  modelo_moto text,
  placa text,
  id_empresa uuid references empresas(id_empresa),
  puntos_total integer not null default 0,
  nivel text not null default 'Iniciando',
  insignias jsonb not null default '{}'::jsonb,
  fecha_expedicion timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pasaportes_motero_cedula on pasaportes_motero(cedula);
