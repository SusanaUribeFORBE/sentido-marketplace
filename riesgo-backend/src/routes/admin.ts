import { Router } from 'express';
import { supabase } from '../supabase';

export const adminRouter = Router();

const PIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigoPin(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return `RGO-${code}`;
}

adminRouter.post('/empresas', async (req, res) => {
  const { nombre_constructora, nit, arl_nombre, contacto_sst, email_sst } = req.body;

  if (!nombre_constructora || !nit) {
    return res.status(400).json({ error: 'Faltan datos: nombre_constructora, nit' });
  }

  const { data, error } = await supabase
    .from('empresas')
    .insert({ nombre_constructora, nit, arl_nombre, contacto_sst, email_sst })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Error creando la empresa', detalle: error.message });
  }

  return res.status(201).json(data);
});

adminRouter.get('/empresas', async (_req, res) => {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Error consultando empresas' });
  }

  return res.json(data);
});

adminRouter.post('/pins', async (req, res) => {
  const { id_empresa, cantidad, modulo_asignado, mundo_id } = req.body;

  if (!id_empresa || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos: id_empresa, cantidad' });
  }

  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant < 1 || cant > 500) {
    return res.status(400).json({ error: 'cantidad debe ser un entero entre 1 y 500' });
  }

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id_empresa')
    .eq('id_empresa', id_empresa)
    .maybeSingle();

  if (empresaError) {
    return res.status(500).json({ error: 'Error consultando la empresa' });
  }

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa no encontrada' });
  }

  const pinesGenerados: { codigo_pin: string }[] = [];
  const intentosMax = cant * 5;
  let intentos = 0;

  while (pinesGenerados.length < cant && intentos < intentosMax) {
    intentos++;
    const codigo_pin = generarCodigoPin();

    const { error: insertError } = await supabase.from('control_pins').insert({
      codigo_pin,
      id_empresa,
      modulo_asignado: modulo_asignado || 'SST General',
      mundo_id: mundo_id || 1,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        continue; // colisión de codigo_pin único, reintentar
      }
      return res.status(500).json({ error: 'Error generando PINs', detalle: insertError.message });
    }

    pinesGenerados.push({ codigo_pin });
  }

  if (pinesGenerados.length < cant) {
    return res.status(500).json({ error: 'No se pudieron generar todos los PINs solicitados' });
  }

  return res.status(201).json({
    id_empresa,
    cantidad: pinesGenerados.length,
    pins: pinesGenerados.map((p) => p.codigo_pin),
  });
});

adminRouter.get('/pins', async (req, res) => {
  const { id_empresa } = req.query;

  if (!id_empresa) {
    return res.status(400).json({ error: 'Falta parámetro: id_empresa' });
  }

  const { data, error } = await supabase
    .from('control_pins')
    .select('id, codigo_pin, estado, modulo_asignado, mundo_id, nombre_usuario, fecha_uso, created_at')
    .eq('id_empresa', id_empresa)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Error consultando PINs' });
  }

  const resumen = {
    total: data.length,
    disponible: data.filter((p) => p.estado === 'Disponible').length,
    en_juego: data.filter((p) => p.estado === 'En Juego').length,
    certificado: data.filter((p) => p.estado === 'Certificado').length,
    quemado: data.filter((p) => p.estado === 'Quemado/Fallido').length,
  };

  return res.json({ resumen, pins: data });
});

adminRouter.get('/analytics', async (_req, res) => {
  const [{ count: instalaciones, error: instError }, { data: pinsUsados, error: pinsError }] = await Promise.all([
    supabase.from('app_eventos').select('*', { count: 'exact', head: true }).eq('tipo', 'install'),
    supabase.from('control_pins').select('cedula_usuario, estado').not('cedula_usuario', 'is', null),
  ]);

  if (instError || pinsError) {
    return res.status(500).json({ error: 'Error consultando analítica' });
  }

  const usuariosActivos = new Set(pinsUsados.map((p) => p.cedula_usuario)).size;
  const certificados = pinsUsados.filter((p) => p.estado === 'Certificado').length;

  return res.json({
    instalaciones: instalaciones || 0,
    usuarios_activos: usuariosActivos,
    certificados_emitidos: certificados,
  });
});
