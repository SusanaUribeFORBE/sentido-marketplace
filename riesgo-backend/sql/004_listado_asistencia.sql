-- RiesGO! - Datos adicionales para el Listado de Asistencia ARL AXA COLPATRIA

ALTER TABLE control_pins ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE control_pins ADD COLUMN IF NOT EXISTS celular TEXT;
