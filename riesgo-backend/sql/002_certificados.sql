-- RiesGO! - Certificados generados al aprobar un módulo (PIN -> estado 'Certificado')
-- Nota: nombres en minúsculas (Postgres pliega identificadores sin comillas a minúsculas)

CREATE TABLE IF NOT EXISTS certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin_id UUID NOT NULL REFERENCES control_pins(id),
  id_empresa UUID NOT NULL REFERENCES empresas(id_empresa),
  cedula_usuario TEXT NOT NULL,
  nombre_usuario TEXT NOT NULL,
  modulo TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,
  url_pdf TEXT,
  enviado_a TEXT NOT NULL,
  emitido_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificados_pin ON certificados(pin_id);
CREATE INDEX IF NOT EXISTS idx_certificados_empresa ON certificados(id_empresa);
