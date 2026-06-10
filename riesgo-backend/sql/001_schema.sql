-- RiesGO! - Esquema Supabase (ya ejecutado en el proyecto)
-- Gamificación SST para construcción, distribuido vía ARL (ej. AXA Colpatria)
-- Modelo: cada PIN = un token/intento. Empresa recibe lote de PINs "Disponible".

CREATE TABLE IF NOT EXISTS Empresas (
  id_empresa UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_constructora TEXT NOT NULL,
  nit TEXT UNIQUE NOT NULL,
  arl_nombre TEXT DEFAULT 'AXA COLPATRIA',
  contacto_sst TEXT,
  email_sst TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Control_Pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_pin TEXT UNIQUE NOT NULL,
  id_empresa UUID REFERENCES Empresas(id_empresa),
  estado TEXT DEFAULT 'Disponible'
    CHECK (estado IN ('Disponible','En Juego','Certificado','Quemado/Fallido')),
  modulo_asignado TEXT DEFAULT 'SST General',
  mundo_id INTEGER DEFAULT 1,
  cedula_usuario TEXT,
  nombre_usuario TEXT,
  fecha_uso TIMESTAMP,
  ip_origen TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
