-- RiesGO! - Detalle de respuestas por pregunta/reto, para analítica por cargo
-- Permite responder preguntas tipo "¿qué % de los conductores de grúa falla en X situación?"

create table if not exists resultados_preguntas (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references control_pins(id),
  id_empresa uuid references empresas(id_empresa),
  modulo text not null,
  cargo text,
  nivel text not null,
  pregunta_id text not null,
  pregunta_texto text,
  correcta boolean not null,
  created_at timestamp default now()
);

create index if not exists idx_resultados_preguntas_modulo on resultados_preguntas(modulo, pregunta_id);
create index if not exists idx_resultados_preguntas_pin on resultados_preguntas(pin_id);
