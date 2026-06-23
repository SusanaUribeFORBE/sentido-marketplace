import { Router } from 'express';
import { supabase } from '../supabase';
import { generarCertificado } from '../services/certificado';
import { actualizarPasaporte, obtenerPasaporte, MODULOS_CON_PASAPORTE } from '../services/pasaporteMotero';

export const gameRouter = Router();

gameRouter.post('/finalizar', async (req, res) => {
  const { pin_id, resultado, detalle } = req.body;

  if (!pin_id || !resultado) {
    return res.status(400).json({ error: 'Faltan datos: pin_id, resultado' });
  }

  if (resultado !== 'aprobado' && resultado !== 'reprobado') {
    return res.status(400).json({ error: "resultado debe ser 'aprobado' o 'reprobado'" });
  }

  const { data: existing, error: findError } = await supabase
    .from('control_pins')
    .select('*')
    .eq('id', pin_id)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ error: 'Error consultando el PIN' });
  }

  if (!existing) {
    return res.status(404).json({ error: 'PIN no encontrado' });
  }

  if (existing.estado !== 'En Juego') {
    return res.status(409).json({ error: `El PIN no está en juego (estado: ${existing.estado})` });
  }

  const nuevoEstado = resultado === 'aprobado' ? 'Certificado' : 'Quemado/Fallido';

  const { data: updated, error: updateError } = await supabase
    .from('control_pins')
    .update({ estado: nuevoEstado })
    .eq('id', pin_id)
    .eq('estado', 'En Juego')
    .select()
    .maybeSingle();

  if (updateError) {
    return res.status(500).json({ error: 'Error actualizando el PIN' });
  }

  if (!updated) {
    return res.status(409).json({ error: 'El PIN ya fue finalizado' });
  }

  if (Array.isArray(detalle) && detalle.length > 0) {
    const filas = detalle.map((d: any) => ({
      pin_id: updated.id,
      id_empresa: updated.id_empresa,
      modulo: updated.modulo_asignado,
      cargo: updated.cargo,
      nivel: d.nivel || '',
      pregunta_id: d.pregunta_id,
      pregunta_texto: d.pregunta_texto,
      correcta: !!d.correcta,
    }));

    const { error: detalleError } = await supabase.from('resultados_preguntas').insert(filas);
    if (detalleError) {
      console.error('Error guardando detalle de respuestas:', detalleError);
    }
  }

  if (nuevoEstado !== 'Certificado') {
    return res.json({
      pin_id: updated.id,
      estado: updated.estado,
      modulo_asignado: updated.modulo_asignado,
    });
  }

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('*')
    .eq('id_empresa', updated.id_empresa)
    .single();

  if (empresaError || !empresa) {
    return res.status(500).json({ error: 'Error consultando la empresa para el certificado' });
  }

  try {
    const certificado = await generarCertificado({
      pinId: updated.id,
      idEmpresa: empresa.id_empresa,
      cedulaUsuario: updated.cedula_usuario,
      nombreUsuario: updated.nombre_usuario,
      modulo: updated.modulo_asignado,
      nombreEmpresa: empresa.nombre_constructora,
      emailSst: empresa.email_sst,
    });

    let pasaporte;
    if (MODULOS_CON_PASAPORTE.has(updated.modulo_asignado) && Array.isArray(detalle) && detalle.length > 0) {
      try {
        pasaporte = await actualizarPasaporte({
          cedula: updated.cedula_usuario,
          nombre: updated.nombre_usuario,
          celular: updated.celular,
          idEmpresa: empresa.id_empresa,
          detalle,
        });
      } catch (err) {
        console.error('Error actualizando el pasaporte de movilidad:', err);
      }
    }

    return res.json({
      pin_id: updated.id,
      estado: updated.estado,
      modulo_asignado: updated.modulo_asignado,
      certificado: {
        codigo_qr: certificado.codigo_qr,
        url_pdf: certificado.url_pdf,
        enviado_a: certificado.enviado_a,
      },
      pasaporte,
    });
  } catch (err) {
    console.error('Error generando certificado:', err);
    return res.status(500).json({ error: 'PIN certificado pero falló la generación del certificado' });
  }
});

gameRouter.get('/pasaporte/:cedula', async (req, res) => {
  try {
    const data = await obtenerPasaporte(req.params.cedula);
    if (!data) {
      return res.status(404).json({ error: 'No encontramos un pasaporte con esa cédula' });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando el pasaporte' });
  }
});

gameRouter.get('/verificar/:codigo', async (req, res) => {
  const { data, error } = await supabase
    .from('certificados')
    .select('codigo_qr, nombre_usuario, cedula_usuario, modulo, emitido_at, url_pdf, id_empresa')
    .eq('codigo_qr', req.params.codigo)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error consultando el certificado' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Certificado no encontrado' });
  }

  return res.json(data);
});
