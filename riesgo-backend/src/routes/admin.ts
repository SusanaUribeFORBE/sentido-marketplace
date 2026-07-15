import { Router } from 'express';
import { supabase } from '../supabase';
import { generarListadoAsistencia } from '../services/listadoAsistencia';

export const adminRouter = Router();

const PIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigoPin(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return `RGO-${code}`;
}

function generarCodigoAcceso(): string {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return `CLI-${code}`;
}

adminRouter.post('/empresas', async (req, res) => {
  const { nombre_constructora, nit, arl_nombre, contacto_sst, email_sst } = req.body;

  if (!nombre_constructora || !nit) {
    return res.status(400).json({ error: 'Faltan datos: nombre_constructora, nit' });
  }

  let data;
  let intentos = 0;
  while (!data && intentos < 5) {
    intentos++;
    const codigo_acceso = generarCodigoAcceso();
    const { data: insertado, error } = await supabase
      .from('empresas')
      .insert({ nombre_constructora, nit, arl_nombre, contacto_sst, email_sst, codigo_acceso })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('codigo_acceso')) {
        continue; // colisión de codigo_acceso único, reintentar
      }
      return res.status(500).json({ error: 'Error creando la empresa', detalle: error.message });
    }
    data = insertado;
  }

  if (!data) {
    return res.status(500).json({ error: 'No se pudo generar un código de acceso único' });
  }

  return res.status(201).json(data);
});

adminRouter.patch('/empresas/:id_empresa/email', async (req, res) => {
  const { id_empresa } = req.params;
  const { email_sst } = req.body;
  if (!email_sst) return res.status(400).json({ error: 'Falta email_sst' });

  const { data, error } = await supabase
    .from('empresas')
    .update({ email_sst })
    .eq('id_empresa', id_empresa)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Empresa no encontrada' });
  return res.json({ ok: true, email_sst: data.email_sst });
});

adminRouter.post('/empresas/:id_empresa/regenerar-codigo', async (req, res) => {
  const { id_empresa } = req.params;

  let data;
  let intentos = 0;
  while (!data && intentos < 5) {
    intentos++;
    const codigo_acceso = generarCodigoAcceso();
    const { data: actualizado, error } = await supabase
      .from('empresas')
      .update({ codigo_acceso })
      .eq('id_empresa', id_empresa)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        continue; // colisión de codigo_acceso único, reintentar
      }
      return res.status(500).json({ error: 'Error regenerando el código', detalle: error.message });
    }
    data = actualizado;
  }

  if (!data) {
    return res.status(404).json({ error: 'Empresa no encontrada o no se pudo regenerar el código' });
  }

  return res.json(data);
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

adminRouter.get('/certificados', async (req, res) => {
  const { id_empresa } = req.query;

  let query = supabase
    .from('certificados')
    .select('codigo_qr, nombre_usuario, cedula_usuario, modulo, url_pdf, emitido_at, id_empresa, empresas(nombre_constructora)')
    .order('emitido_at', { ascending: false });

  if (id_empresa) {
    query = query.eq('id_empresa', id_empresa);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Error consultando certificados' });
  }

  return res.json(data);
});

adminRouter.get('/listado-asistencia', async (req, res) => {
  const { id_empresa, modulo } = req.query;

  if (!id_empresa || !modulo) {
    return res.status(400).json({ error: 'Faltan parámetros: id_empresa, modulo' });
  }

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('nombre_constructora, nit')
    .eq('id_empresa', id_empresa)
    .maybeSingle();

  if (empresaError || !empresa) {
    return res.status(404).json({ error: 'Empresa no encontrada' });
  }

  const { data: pins, error: pinsError } = await supabase
    .from('control_pins')
    .select('nombre_usuario, cedula_usuario, cargo, celular, fecha_uso, estado')
    .eq('id_empresa', id_empresa)
    .eq('modulo_asignado', modulo)
    .in('estado', ['Certificado', 'Quemado/Fallido'])
    .order('fecha_uso', { ascending: true });

  if (pinsError) {
    return res.status(500).json({ error: 'Error consultando participantes' });
  }

  if (!pins || pins.length === 0) {
    return res.status(404).json({ error: 'No hay participantes para esa empresa y módulo' });
  }

  const buffer = await generarListadoAsistencia({
    nombreEmpresa: empresa.nombre_constructora,
    nitEmpresa: empresa.nit,
    modulo: String(modulo),
    participantes: pins,
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="listado-asistencia.xlsx"');
  return res.send(Buffer.from(buffer));
});

adminRouter.get('/analitica-preguntas', async (req, res) => {
  const { id_empresa, modulo } = req.query;

  if (!modulo) {
    return res.status(400).json({ error: 'Falta parámetro: modulo' });
  }

  let query = supabase
    .from('resultados_preguntas')
    .select('pregunta_id, pregunta_texto, nivel, cargo, correcta')
    .eq('modulo', modulo);

  if (id_empresa) {
    query = query.eq('id_empresa', id_empresa);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Error consultando resultados' });
  }

  type Grupo = { pregunta_id: string; pregunta_texto: string; nivel: string; intentos: number; fallos: number };
  type GrupoCargo = Grupo & { cargo: string };

  const porPregunta = new Map<string, Grupo>();
  const porPreguntaCargo = new Map<string, GrupoCargo>();

  for (const fila of data || []) {
    const clave = fila.pregunta_id;
    if (!porPregunta.has(clave)) {
      porPregunta.set(clave, {
        pregunta_id: fila.pregunta_id,
        pregunta_texto: fila.pregunta_texto,
        nivel: fila.nivel,
        intentos: 0,
        fallos: 0,
      });
    }
    const grupo = porPregunta.get(clave)!;
    grupo.intentos += 1;
    if (!fila.correcta) grupo.fallos += 1;

    const cargo = fila.cargo && fila.cargo.trim() ? fila.cargo.trim() : 'Sin especificar';
    const claveCargo = `${clave}::${cargo}`;
    if (!porPreguntaCargo.has(claveCargo)) {
      porPreguntaCargo.set(claveCargo, {
        pregunta_id: fila.pregunta_id,
        pregunta_texto: fila.pregunta_texto,
        nivel: fila.nivel,
        cargo,
        intentos: 0,
        fallos: 0,
      });
    }
    const grupoCargo = porPreguntaCargo.get(claveCargo)!;
    grupoCargo.intentos += 1;
    if (!fila.correcta) grupoCargo.fallos += 1;
  }

  const conPorcentaje = <T extends Grupo>(g: T) => ({
    ...g,
    porcentaje_fallo: Math.round((g.fallos / g.intentos) * 100),
  });

  const general = Array.from(porPregunta.values())
    .map(conPorcentaje)
    .sort((a, b) => b.porcentaje_fallo - a.porcentaje_fallo);

  const porCargo = Array.from(porPreguntaCargo.values())
    .map(conPorcentaje)
    .sort((a, b) => b.porcentaje_fallo - a.porcentaje_fallo);

  return res.json({ general, por_cargo: porCargo });
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
