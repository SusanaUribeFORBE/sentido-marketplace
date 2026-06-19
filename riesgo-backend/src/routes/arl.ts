import { Router } from 'express';
import { supabase } from '../supabase';

export const arlRouter = Router();

const ARL_NOMBRE = 'AXA COLPATRIA';

async function idsEmpresasArl(): Promise<string[]> {
  const { data, error } = await supabase.from('empresas').select('id_empresa').eq('arl_nombre', ARL_NOMBRE);

  if (error) throw error;
  return (data || []).map((e) => e.id_empresa);
}

function mapaEmpresas(empresas: { id_empresa: string; nombre_constructora: string; nit: string }[]) {
  const mapa = new Map<string, { nombre_constructora: string; nit: string }>();
  for (const e of empresas) {
    mapa.set(e.id_empresa, { nombre_constructora: e.nombre_constructora, nit: e.nit });
  }
  return mapa;
}

arlRouter.get('/pins', async (_req, res) => {
  try {
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id_empresa, nombre_constructora, nit')
      .eq('arl_nombre', ARL_NOMBRE);

    if (empresasError) throw empresasError;

    const ids = (empresas || []).map((e) => e.id_empresa);
    if (ids.length === 0) return res.json([]);

    const mapa = mapaEmpresas(empresas || []);

    const { data, error } = await supabase
      .from('control_pins')
      .select('codigo_pin, estado, modulo_asignado, nombre_usuario, cedula_usuario, cargo, fecha_uso, created_at, id_empresa')
      .in('id_empresa', ids);

    if (error) throw error;

    const filas = (data || []).map((p) => ({
      codigo_pin: p.codigo_pin,
      estado: p.estado,
      modulo_asignado: p.modulo_asignado,
      nombre_usuario: p.nombre_usuario,
      cedula_usuario: p.cedula_usuario,
      cargo: p.cargo,
      fecha_uso: p.fecha_uso,
      created_at: p.created_at,
      nombre_constructora: mapa.get(p.id_empresa)?.nombre_constructora || '',
      nit: mapa.get(p.id_empresa)?.nit || '',
    }));

    return res.json(filas);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando PINs' });
  }
});

arlRouter.get('/certificados', async (_req, res) => {
  try {
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id_empresa, nombre_constructora, nit')
      .eq('arl_nombre', ARL_NOMBRE);

    if (empresasError) throw empresasError;

    const ids = (empresas || []).map((e) => e.id_empresa);
    if (ids.length === 0) return res.json([]);

    const mapa = mapaEmpresas(empresas || []);

    const { data, error } = await supabase
      .from('certificados')
      .select('codigo_qr, nombre_usuario, cedula_usuario, modulo, url_pdf, emitido_at, id_empresa')
      .in('id_empresa', ids);

    if (error) throw error;

    const filas = (data || []).map((c) => ({
      codigo_qr: c.codigo_qr,
      nombre_usuario: c.nombre_usuario,
      cedula_usuario: c.cedula_usuario,
      modulo: c.modulo,
      url_pdf: c.url_pdf,
      emitido_at: c.emitido_at,
      nombre_constructora: mapa.get(c.id_empresa)?.nombre_constructora || '',
      nit: mapa.get(c.id_empresa)?.nit || '',
    }));

    return res.json(filas);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando certificados' });
  }
});

arlRouter.get('/resultados-preguntas', async (_req, res) => {
  try {
    const ids = await idsEmpresasArl();
    if (ids.length === 0) return res.json([]);

    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id_empresa, nombre_constructora, nit')
      .in('id_empresa', ids);

    if (empresasError) throw empresasError;
    const mapa = mapaEmpresas(empresas || []);

    const { data, error } = await supabase
      .from('resultados_preguntas')
      .select('modulo, nivel, pregunta_id, pregunta_texto, cargo, correcta, created_at, id_empresa')
      .in('id_empresa', ids);

    if (error) throw error;

    const filas = (data || []).map((r) => ({
      modulo: r.modulo,
      nivel: r.nivel,
      pregunta_id: r.pregunta_id,
      pregunta_texto: r.pregunta_texto,
      cargo: r.cargo,
      correcta: r.correcta,
      created_at: r.created_at,
      nombre_constructora: mapa.get(r.id_empresa)?.nombre_constructora || '',
      nit: mapa.get(r.id_empresa)?.nit || '',
    }));

    return res.json(filas);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando resultados de preguntas' });
  }
});
