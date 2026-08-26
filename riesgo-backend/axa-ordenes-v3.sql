-- Ejecutar en Supabase > SQL Editor
ALTER TABLE axa_ordenes
  ADD COLUMN IF NOT EXISTS fechas_ejecucion JSONB DEFAULT '[]';
