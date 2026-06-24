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

  -- Vínculo con la cuenta de autenticación (login por magic link)
  -- Se asigna sola la primera vez que el emprendedor inicia sesión con su correo
  user_id          uuid        references auth.users(id),

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

create unique index if not exists entrepreneurs_email_unique_idx
  on entrepreneurs (lower(email)) where (email is not null and email <> '');

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

-- El admin (panel admin.html) puede insertar al aprobar una solicitud (MVP permisivo)
create policy "anon_insert_entrepreneurs"
  on entrepreneurs for insert
  with check (true);

-- Un emprendedor reclama su propio perfil la primera vez que inicia sesión
-- (su correo en auth debe coincidir con el correo guardado en su fila, y aún sin reclamar)
create policy "claim_own_entrepreneur"
  on entrepreneurs for update
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and user_id is null)
  with check (user_id = auth.uid());

-- Un emprendedor solo puede editar su propio perfil, ya reclamado
create policy "edit_own_entrepreneur"
  on entrepreneurs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Storage: bucket público para fotos de los emprendimientos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "public_read_fotos"
  on storage.objects for select
  using (bucket_id = 'fotos');

create policy "own_folder_insert_fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_folder_update_fotos"
  on storage.objects for update
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_folder_delete_fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

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
-- Seed: los 19 emprendimientos actuales (antes hardcoded en data.js)
-- Cada uno puede reclamar su perfil iniciando sesión con su correo real
-- ============================================================
insert into entrepreneurs (name, city, tagline, formal, seals, impact, photo_url, products, whatsapp, email, onboarding_complete, active) values
  ('Luzmar Brilla Natural', 'Norte de Santander', 'Shampoo y jabones naturales artesanales con fórmulas ancestrales de nuestros abuelos.', 'SÍ', 'Bienestar Consciente;Liderazgo que Inspira;Jefatura de Hogar;Producción Limpia', '~400 personas/año beneficiadas. Emplea madres cabeza de familia en pedidos grandes. Fórmulas transmitidas por 3 generaciones.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=400&fit=crop', '[{"name":"Shampoo Romero y Miel","price":"Litro $50.000 / Medio $27.000","rawPrice":"27000"},{"name":"Jabón Glicerina de Arroz","price":"Grande $12.000 / Mediano $7.000","rawPrice":"7000"},{"name":"Sal Relajante Eucalipto","price":"Tarro 120g $12.000","rawPrice":"12000"}]'::jsonb, '573001234561', 'luzmarinaf947@gmail.com', true, true),
  ('Lekatta', 'Medellín', 'Snacks horneados artesanalmente para mascotas con proteínas de alta calidad, sin conservantes.', 'NO', 'Bienestar Consciente', 'Promovemos hábitos saludables en mascotas para prevenir obesidad y fortalecer el vínculo humano-animal.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop', '[{"name":"Galletas de Salmón","price":"$20.000 bolsa 100g","rawPrice":"20000"},{"name":"Galleta de Cordero","price":"$18.000 bolsa 100g","rawPrice":"18000"},{"name":"Galleta de Búfalo","price":"$20.000 bolsa 100g","rawPrice":"20000"}]'::jsonb, '573002234562', 'luicasama@gmail.com', true, true),
  ('Fundación Renacer Sin Fronteras', 'Medellín', 'Apoyamos micro y pequeñas empresas en gestión humana y automatización de procesos.', 'SÍ', 'Liderazgo que Inspira;Comercio Justo;Innovación Sostenible', '3 emprendimientos gestionados con 16 empleados. Apoya formalización de migrantes venezolanos.', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop', '[{"name":"Gestión Humana de Bolsillo","price":"$2.600.000/mes","rawPrice":"2600000"},{"name":"Automatización de Procesos","price":"$150.000/hora","rawPrice":"150000"},{"name":"CRM Integral con IA","price":"$1.000.000/mes","rawPrice":"1000000"}]'::jsonb, '573003234563', 'cvelasco@fundarenacersf.org', true, true),
  ('Coraje Dog', 'Santa Marta', 'Comida rápida de calidad con sazón único y el amor que cada familia merece.', 'NO', 'Jefatura de Hogar', 'Emprendimiento de madre cabeza de hogar. Ingredientes de calidad, sazón propio e innovación culinaria.', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=400&fit=crop', '[{"name":"Salchipapa Trifásica","price":"$23.000","rawPrice":"23000"},{"name":"Hamburguesa Coraje","price":"$28.000","rawPrice":"28000"},{"name":"Perro Coraje Familiar","price":"$35.000","rawPrice":"35000"}]'::jsonb, '573004234564', 'ysma010125@gmail.com', true, true),
  ('Monsie', 'Bogotá', 'Ropa infantil económica y de calidad, apoyando a jóvenes que estudian en Bogotá.', 'En proceso', 'Jefatura de Hogar', 'Apoya estudiantes de diseño y ofrece ropa infantil a precio accesible para familias colombianas.', 'https://images.unsplash.com/photo-1560859259-fcf2b952aed8?w=800&h=400&fit=crop', '[{"name":"Oversize Niño","price":"$32.000 al por mayor","rawPrice":"32000"},{"name":"Conjunto Niña Ángel","price":"$28.000 al por mayor","rawPrice":"28000"},{"name":"Conjunto Oversize Cuello Redondo","price":"$30.000 al por mayor","rawPrice":"30000"}]'::jsonb, '573005234565', 'milena.monroy2015@gmail.com', true, true),
  ('TodoSacha', 'Madrid, Cundinamarca', 'Productos de Sacha Inchi orgánicos con economía circular y cero residuos. Premio AVPA París 2021.', 'SÍ', 'Adulto Mayor Activo;Origen Rural;Biocomercio;Economía Circular;Producción Limpia;Comercio Justo', '369 agricultores beneficiados. 9 toneladas/mes. Certificados USDA, FDA. Premio AVPA París 2021. Cero residuos en producción.', 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&h=400&fit=crop', '[{"name":"Aceite Omega-3 SachaD''Lux","price":"$79.900","rawPrice":"79900"},{"name":"Harina de Sacha Inchi 250g","price":"$45.000","rawPrice":"45000"},{"name":"Nueces Snack 50g","price":"$13.000","rawPrice":"13000"}]'::jsonb, '573006234566', 'todosacha@gmail.com', true, true),
  ('Kattaleya Accesorios', 'Medellín', 'Accesorios Miyuki ancestrales inspirados en fauna y flora colombiana. Red de 13 tejedoras.', 'NO', 'Economía Circular;Producción Limpia;Cero Plástico;Inclusión & Empleo Digno', '13 tejedoras + 15 embajadoras generan ingresos desde casa. 0% desperdicio de materia prima.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=400&fit=crop', '[{"name":"Aretas Orquídea Dorada (miyuki)","price":"$290.000","rawPrice":"290000"},{"name":"Collar Orquídea Kattaleya","price":"$260.000","rawPrice":"260000"},{"name":"Brazalete Miyuki Ajustable","price":"$160.000","rawPrice":"160000"}]'::jsonb, '573007234567', 'kattaleya.accesorios@gmail.com', true, true),
  ('ITAKA', 'Medellín', 'Customizamos ropa de segunda mano para reducir el impacto ambiental de la industria de la moda.', 'NO', 'Jefatura de Hogar;Economía Circular;Producción Limpia', '3 costureras empleadas. 20 kg de ropa reutilizada semanal. Prendas únicas con identidad propia.', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=400&fit=crop', '[{"name":"Blazer Dama Customizado","price":"$80.000","rawPrice":"80000"},{"name":"Blazer Men Customizado","price":"$150.000","rawPrice":"150000"},{"name":"Chaqueta de Jean Intervenida","price":"$130.000","rawPrice":"130000"}]'::jsonb, '573008234568', 'andrealzate347@gmail.com', true, true),
  ('Maxxi Clean', 'Medellín', 'Productos de aseo biodegradables sin derivados del petróleo, a precios iguales o menores que los tradicionales.', 'SÍ', 'Jefatura de Hogar;Economía Circular;Producción Limpia;Cero Plástico;Bienestar Consciente', '+10 toneladas/mes de productos biodegradables. +5.000 empaques reutilizados. Capacidad: 40 ton/mes.', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=400&fit=crop', '[{"name":"Detergente Maxxi Clean","price":"Litro $8.500","rawPrice":"8500"},{"name":"Lavaloza Biodegradable","price":"Litro $7.500","rawPrice":"7500"},{"name":"Línea Institucional","price":"Cotización por volumen","rawPrice":""}]'::jsonb, '573009234569', 'gerencia@maxxiclean.com.co', true, true),
  ('Linamar.skin', 'Campo de la Cruz, Atlántico', 'Productos botánicos para el bienestar con saberes ancestrales para el cuidado de piel y cabello.', 'SÍ', 'Adulto Mayor Activo;Saberes Ancestrales;Inclusión & Empleo;Liderazgo Femenino;Jefatura de Hogar', 'Liderado por mujer visitadora médica. Ingredientes naturales y fórmulas ancestrales para toda la familia.', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=400&fit=crop', '[{"name":"Jabón Botánico Linamar","price":"Arroz, miel, soya, vit. C","rawPrice":""},{"name":"Crema Facial Hidratante + SPF","price":"$45.000","rawPrice":"45000"},{"name":"Shampoo Romero y Cebolla","price":"Anticaída y crecimiento","rawPrice":""}]'::jsonb, '573010234570', 'munozospinol@gmail.com', true, true),
  ('Ritual Repostería', 'Medellín', 'Tortas artesanales con sabores locales colombianos para celebrar los momentos de la vida.', 'NO', 'Adulto Mayor Activo;Inclusión & Empleo;Liderazgo Femenino;Cero Plástico', 'Liderado por mujer. Emplea madres cabeza de hogar. Empaques tipo regalo sin plástico.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop', '[{"name":"Torta Origen — Almojábana","price":"$99.000 (12 porciones)","rawPrice":"99000"},{"name":"Torta de la Casa — Zanahoria","price":"$88.000 (12 porciones)","rawPrice":"88000"},{"name":"Torta Victoria — Tres Leches","price":"$83.000 (12 porciones)","rawPrice":"83000"}]'::jsonb, '573011234571', 'ritualreposteria@gmail.com', true, true),
  ('Potencial — TransformaSion', 'Medellín', 'Economía circular con impacto 360°. Maximizamos el potencial de las cosas para desarrollar el de las personas.', 'SÍ', 'Inclusión & Empleo;Liderazgo Femenino;Jefatura de Hogar;Economía Circular;Producción Limpia', '45 familias bajo el puente Madre Laura. 30 niños/mes en casa hogar. 80%+ del equipo: mujeres.', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=400&fit=crop', '[{"name":"Ropa Nueva y Segunda Mano","price":"Desde $10.000","rawPrice":"10000"},{"name":"Artículos de Belleza y Cuidado","price":"Desde $10.000","rawPrice":"10000"},{"name":"Juguetes Nuevos y Usados","price":"Desde $10.000","rawPrice":"10000"}]'::jsonb, '573012234572', 'paola@transformasion.co', true, true),
  ('Atracción Estratégica', 'Envigado', 'Tejemos cobijas artesanales para bebés recién nacidos que no tienen nada, con materiales hipoalergénicos.', 'NO', 'Saberes Ancestrales', 'Nació como terapia de rehabilitación física y se convirtió en propósito social: cada cobija llega a una mamá sin recursos para su bebé recién nacido.', 'https://images.unsplash.com/photo-1693387369575-df25ef8424e7?w=800&h=400&fit=crop', '[{"name":"Cobija para Bebé","price":"$20.000","rawPrice":"20000"}]'::jsonb, '573016499815', 'mcarvajalb@gmail.com', true, true),
  ('LylosArt', 'Rionegro, Antioquia', 'Tejido artesanal en crochet y telar vertical, usado como herramienta de bienestar emocional y generación de ingresos.', 'En proceso', 'Saberes Ancestrales;Jefatura de Hogar;Origen Rural', 'Nació como terapia de recuperación emocional. Meta de impactar 10-20 personas mediante talleres de tejido. Produce 15-20 piezas artesanales/mes.', 'https://images.unsplash.com/photo-1527383214149-cb7be04ae387?w=800&h=400&fit=crop', '[{"name":"Cojín Alma (Telar Vertical)","price":"$100.000","rawPrice":"100000"},{"name":"Blusa Artesanal Tejida a Mano","price":"$260.000","rawPrice":"260000"},{"name":"Bolso Artesanal Tejido a Mano","price":"$160.000","rawPrice":"160000"}]'::jsonb, '573156667410', 'linayadirajaramillotoro@gmail.com', true, true),
  ('Turbantes Masay', 'Medellín', 'Turbantes, balacas y gorros de satín fabricados con telas africanas exclusivas, junto a grupos vulnerables.', 'En proceso', 'Adulto Mayor Activo;Saberes Ancestrales;Jefatura de Hogar;Origen Rural', 'Nació de una sobreviviente de cáncer de cuello uterino. 3 mujeres empleadas. 300 kg de material reciclado. Beneficia a mujeres oncológicas y afro.', 'https://images.unsplash.com/photo-1763823133159-c6f8ec380e33?w=800&h=400&fit=crop', '[{"name":"Turbante","price":"$22.000","rawPrice":"22000"},{"name":"Balaca","price":"$15.000","rawPrice":"15000"},{"name":"Gorro de Satín","price":"$25.000","rawPrice":"25000"}]'::jsonb, '573006228289', 'leidy716@yahoo.es', true, true),
  ('Aikon Mobiliario', 'Medellín', 'Mobiliario escolar, de oficina y cafetería fabricado con materiales reciclados y aleaciones post-consumo.', 'SÍ', 'Inclusión & Empleo Digno;Jefatura de Hogar;Economía Circular;Producción Limpia', '5 empleos directos en la comuna 15 (desplazados y recicladores). 5 toneladas de desechos evitadas al año. 3.500 sillas y mesas/mes.', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=400&fit=crop', '[{"name":"Pupitre y Silla Escolar","price":"$650.000","rawPrice":"650000"},{"name":"Silla de Oficina","price":"$180.000","rawPrice":"180000"},{"name":"Silla Universitaria","price":"$220.000","rawPrice":"220000"}]'::jsonb, '573003551567', 'gerencia.aikon@gmail.com', true, true),
  ('KUPU Candles', 'Medellín', 'Velas aromáticas, decorativas e hidratantes para masaje, elaboradas a mano con cera y materiales reciclables.', 'NO', 'Jefatura de Hogar;Cero Plástico;Producción Limpia;Innovación Sostenible', 'Nació para trabajar desde casa sin dejar solas a sus hijas. Sustento de una madre cabeza de familia. 150-250 unidades/mes.', 'https://images.unsplash.com/photo-1603218678692-3967d7523bb0?w=800&h=400&fit=crop', '[{"name":"Vela Aromática Mediana","price":"$20.000","rawPrice":"20000"},{"name":"Vela Hidratante para Masaje","price":"$30.000","rawPrice":"30000"},{"name":"Vela Decorativa con Figuras","price":"$12.000","rawPrice":"12000"}]'::jsonb, '573128314305', 'patriciaguti0607@gmail.com', true, true),
  ('Productos Ecopeques', 'Medellín', 'Pañales ecológicos reutilizables para bebés y adultos, con absorbentes intercambiables que ahorran hasta 80%.', 'SÍ', 'Producción Limpia;Cero Plástico;Bienestar Consciente', 'Evita que cada bebé deseche 6.500-7.000 pañales desechables (400+ años en degradarse). Familias ahorran hasta 80%. +1.000 unidades/mes.', 'https://images.unsplash.com/photo-1552511762-898bfd9fb837?w=800&h=400&fit=crop', '[{"name":"Pañal Ecológico Broches (Bebé)","price":"$82.999","rawPrice":"82999"},{"name":"Pañal Ecológico Adulto Talla M","price":"$168.000","rawPrice":"168000"},{"name":"Pañal de Piscina para Niños","price":"$57.999","rawPrice":"57999"}]'::jsonb, '573145848081', 'ecopequespanales@gmail.com', true, true),
  ('De Mentes Pensantes', 'Medellín', 'Diseñamos experiencias lúdicas que fortalecen el bienestar, la salud mental y el liderazgo en organizaciones y comunidades.', 'SÍ', 'Liderazgo Femenino;Bienestar Consciente;Inclusión & Empleo Digno;Economía Circular', '+1.800 personas impactadas mediante festivales y procesos organizacionales en empresas, comunidades e instituciones de Antioquia.', 'https://images.unsplash.com/photo-1646579886741-12b59840c63f?w=800&h=400&fit=crop', '[{"name":"Festival De Mentes","price":"Desde $1.800.000","rawPrice":"1800000"},{"name":"Programa de Bienestar y Salud Mental","price":"Desde $3.800.000","rawPrice":"3800000"},{"name":"Línea de Juegos y Dispositivos Lúdicos DMP","price":"Desde $320.000","rawPrice":"320000"}]'::jsonb, '573146672759', 'dementespensantesmedellin@gmail.com', true, true);

-- ============================================================
-- FIN — Revisa en Table Editor que las tablas se crearon OK
-- ============================================================
