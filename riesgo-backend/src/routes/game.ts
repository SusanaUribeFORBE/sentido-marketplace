import { Router } from 'express';
import { supabase } from '../supabase';

export const gameRouter = Router();

gameRouter.post('/finalizar', async (req, res) => {
  const { pin_id, resultado } = req.body;

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

  return res.json({
    pin_id: updated.id,
    estado: updated.estado,
    modulo_asignado: updated.modulo_asignado,
  });
});
