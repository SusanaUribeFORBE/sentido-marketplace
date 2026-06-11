-- RiesGO! - Eventos de analítica (instalación de la PWA, etc.)

create table if not exists app_eventos (
  id uuid default gen_random_uuid() primary key,
  tipo text not null check (tipo in ('install')),
  user_agent text,
  created_at timestamp default now()
);

create index if not exists idx_app_eventos_tipo on app_eventos(tipo);
