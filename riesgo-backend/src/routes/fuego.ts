import { Router } from 'express';
import { supabase } from '../supabase';

export const fuegoRouter = Router();

// ── Extintores ──

fuegoRouter.get('/extintores', async (req, res) => {
  const { empresa, estado } = req.query as Record<string, string>;
  let q = supabase.from('extintores').select('*').order('empresa').order('ubicacion');
  if (empresa) q = q.ilike('empresa', `%${empresa}%`);
  if (estado)  q = q.eq('estado', estado);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

fuegoRouter.post('/extintores', async (req, res) => {
  const { data, error } = await supabase.from('extintores').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

fuegoRouter.put('/extintores/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('extintores').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

fuegoRouter.delete('/extintores/:id', async (req, res) => {
  const { error } = await supabase.from('extintores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// ── Inspecciones ──

fuegoRouter.get('/inspecciones', async (req, res) => {
  const { extintor_id } = req.query as Record<string, string>;
  let q = supabase
    .from('inspecciones_extintor')
    .select('*, extintor:extintores(empresa, ubicacion, tipo, codigo)')
    .order('fecha_inspeccion', { ascending: false })
    .limit(200);
  if (extintor_id) q = q.eq('extintor_id', extintor_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

fuegoRouter.post('/inspecciones', async (req, res) => {
  const body = req.body;
  // Auto-calcular resultado si no viene
  if (!body.resultado) {
    const checks = ['ubicacion_correcta','sin_obstrucciones','manometro_ok','sello_ok',
                    'pin_ok','manguera_ok','etiquetas_ok','cilindro_ok'];
    const fallos = checks.filter(c => body[c] === false || body[c] === 'false').length;
    body.resultado = fallos === 0 ? 'Aprobado' : fallos <= 2 ? 'Requiere atención' : 'Fuera de servicio';
  }
  const { data, error } = await supabase.from('inspecciones_extintor').insert(body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── Dashboard KPIs ──

fuegoRouter.get('/dashboard', async (_req, res) => {
  const hoy  = new Date().toISOString().slice(0, 10);
  const mes  = hoy.slice(0, 7) + '-01';
  const d60  = new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10);

  const [cTotal, cActivo, cInspecMes, { data: vencen }, { data: recientes }] = await Promise.all([
    supabase.from('extintores').select('*', { count: 'exact', head: true }),
    supabase.from('extintores').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('inspecciones_extintor').select('*', { count: 'exact', head: true }).gte('fecha_inspeccion', mes),
    supabase.from('extintores')
      .select('id, empresa, sede, ubicacion, tipo, codigo, fecha_vencimiento')
      .lte('fecha_vencimiento', d60)
      .gte('fecha_vencimiento', hoy)
      .eq('estado', 'Activo')
      .order('fecha_vencimiento'),
    supabase.from('inspecciones_extintor')
      .select('*, extintor:extintores(empresa, ubicacion, tipo, codigo)')
      .order('fecha_inspeccion', { ascending: false })
      .limit(5),
  ]);

  res.json({
    total_extintores:   cTotal.count  ?? 0,
    activos:            cActivo.count ?? 0,
    inspecciones_mes:   cInspecMes.count ?? 0,
    vencen_pronto:      vencen   ?? [],
    ultimas_inspecciones: recientes ?? [],
  });
});
