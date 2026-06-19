-- RiesGO! - Acceso de solo lectura para la empresa cliente (ej. AXA Colpatria o una constructora)
-- Permite que el cliente vea sus propios PINs, certificados y analitica sin ver otras empresas.

alter table empresas add column if not exists codigo_acceso text unique;
