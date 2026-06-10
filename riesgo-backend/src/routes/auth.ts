import { Router } from 'express';
import { supabase } from '../supabase';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { codigo_pin, cedula_usuario, nombre_usuario } = req.body;

  if (!codigo_pin || !cedula_usuario || !nombre_usuario) {
    return res.status(400).json({ error: 'Faltan datos: codigo_pin, cedula_usuario, nombre_usuario' });
  }

  const pin = String(codigo_pin).trim().toUpperCase();

  const { data: existing, error: findError } = await supabase
    .from('control_pins')
    .select('*')
    .eq('codigo_pin', pin)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ error: 'Error consultando el PIN' });
  }

  if (!existing) {
    return res.status(404).json({ error: 'PIN no encontrado' });
  }

  if (existing.estado !== 'Disponible') {
    return res.status(403).json({ error: `PIN no disponible (estado: ${existing.estado})` });
  }

  const { data: updated, error: updateError } = await supabase
    .from('control_pins')
    .update({
      estado: 'En Juego',
      cedula_usuario,
      nombre_usuario,
      fecha_uso: new Date().toISOString(),
      ip_origen: req.ip,
      user_agent: req.headers['user-agent'] || null,
    })
    .eq('id', existing.id)
    .eq('estado', 'Disponible')
    .select()
    .maybeSingle();

  if (updateError) {
    return res.status(500).json({ error: 'Error actualizando el PIN' });
  }

  if (!updated) {
    return res.status(409).json({ error: 'El PIN acaba de ser utilizado por otro usuario' });
  }

  return res.json({
    pin_id: updated.id,
    modulo_asignado: updated.modulo_asignado,
    mundo_id: updated.mundo_id,
  });
});
