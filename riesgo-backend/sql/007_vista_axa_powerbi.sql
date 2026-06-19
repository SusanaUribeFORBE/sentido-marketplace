-- RiesGO! - Acceso de Power BI para AXA Colpatria (vista consolidada de todas sus empresas)
-- Crea vistas filtradas por arl_nombre = 'AXA COLPATRIA' y un rol de Postgres de solo
-- lectura que SOLO puede consultar esas vistas (no las tablas base ni otras ARL).

create or replace view vista_axa_pins as
  select
    cp.codigo_pin,
    cp.estado,
    cp.modulo_asignado,
    cp.nombre_usuario,
    cp.cedula_usuario,
    cp.cargo,
    cp.fecha_uso,
    cp.created_at,
    e.nombre_constructora,
    e.nit
  from control_pins cp
  join empresas e on e.id_empresa = cp.id_empresa
  where e.arl_nombre = 'AXA COLPATRIA';

create or replace view vista_axa_certificados as
  select
    c.codigo_qr,
    c.nombre_usuario,
    c.cedula_usuario,
    c.modulo,
    c.url_pdf,
    c.emitido_at,
    e.nombre_constructora,
    e.nit
  from certificados c
  join empresas e on e.id_empresa = c.id_empresa
  where e.arl_nombre = 'AXA COLPATRIA';

create or replace view vista_axa_resultados_preguntas as
  select
    rp.modulo,
    rp.nivel,
    rp.pregunta_id,
    rp.pregunta_texto,
    rp.cargo,
    rp.correcta,
    rp.created_at,
    e.nombre_constructora,
    e.nit
  from resultados_preguntas rp
  join empresas e on e.id_empresa = rp.id_empresa
  where e.arl_nombre = 'AXA COLPATRIA';

-- Rol de solo lectura para Power BI. Reemplaza el placeholder por una contraseña
-- fuerte propia antes de ejecutar este script (no dejes una contraseña real en git).
create role axa_readonly with login password 'REEMPLAZAR_CONTRASENA_FUERTE';

grant usage on schema public to axa_readonly;
grant select on vista_axa_pins, vista_axa_certificados, vista_axa_resultados_preguntas to axa_readonly;
