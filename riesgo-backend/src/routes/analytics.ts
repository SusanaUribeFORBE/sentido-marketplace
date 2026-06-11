import { Router } from 'express';
import { supabase } from '../supabase';

export const analyticsRouter = Router();

analyticsRouter.post('/analytics/install', async (req, res) => {
  const { error } = await supabase.from('app_eventos').insert({
    tipo: 'install',
    user_agent: req.headers['user-agent'] || null,
  });

  if (error) {
    return res.status(500).json({ error: 'Error registrando instalación' });
  }

  return res.status(201).json({ ok: true });
});
