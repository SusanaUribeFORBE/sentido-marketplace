import { Router } from 'express';
import { supabase } from '../supabase';
import { generarListadoAsistencia } from '../services/listadoAsistencia';

export const clienteRouter = Router();

clienteRouter.get('/me', async (_req, res) => {
  return res.json(res.locals.empresa);
});

clienteRouter.get('/pins', async (_req, res) => {
  const idEmpresa = res.locals.empresa.id_empresa;

  const { data, error } = await supabase
    .from('control_pins')
    .select('id, codigo_pin, estado, modulo_asignado, mundo_id, nombre_usuario, fecha_uso, created_at')
    .eq('id_empresa', idEmpresa)
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

clienteRouter.get('/certificados', async (_req, res) => {
  const idEmpresa = res.locals.empresa.id_empresa;

  const { data, error } = await supabase
    .from('certificados')
    .select('codigo_qr, nombre_usuario, cedula_usuario, modulo, url_pdf, emitido_at')
    .eq('id_empresa', idEmpresa)
    .order('emitido_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Error consultando certificados' });
  }

  return res.json(data);
});

clienteRouter.get('/listado-asistencia', async (req, res) => {
  const idEmpresa = res.locals.empresa.id_empresa;
  const { modulo } = req.query;

  if (!modulo) {
    return res.status(400).json({ error: 'Falta parámetro: modulo' });
  }

  const { data: pins, error: pinsError } = await supabase
    .from('control_pins')
    .select('nombre_usuario, cedula_usuario, cargo, celular, fecha_uso, estado')
    .eq('id_empresa', idEmpresa)
    .eq('modulo_asignado', modulo)
    .in('estado', ['Certificado', 'Quemado/Fallido'])
    .order('fecha_uso', { ascending: true });

  if (pinsError) {
    return res.status(500).json({ error: 'Error consultando participantes' });
  }

  if (!pins || pins.length === 0) {
    return res.status(404).json({ error: 'No hay participantes para ese módulo' });
  }

  const buffer = await generarListadoAsistencia({
    nombreEmpresa: res.locals.empresa.nombre_constructora,
    nitEmpresa: res.locals.empresa.nit,
    modulo: String(modulo),
    participantes: pins,
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="listado-asistencia.xlsx"');
  return res.send(Buffer.from(buffer));
});

clienteRouter.get('/analitica-preguntas', async (req, res) => {
  const idEmpresa = res.locals.empresa.id_empresa;
  const { modulo } = req.query;

  if (!modulo) {
    return res.status(400).json({ error: 'Falta parámetro: modulo' });
  }

  const { data, error } = await supabase
    .from('resultados_preguntas')
    .select('pregunta_id, pregunta_texto, nivel, cargo, correcta')
    .eq('modulo', modulo)
    .eq('id_empresa', idEmpresa);

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
