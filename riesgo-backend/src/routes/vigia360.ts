import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';

export const vigia360Router = Router();

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// ── GET /api/vigia360/pat ──────────────────────────────────────────────
vigia360Router.get('/pat', async (req: Request, res: Response) => {
  try {
    const { empresa, año } = req.query as Record<string, string>;
    let q = supabase.from('pat_actividades').select('*').eq('activo', true).order('orden');
    if (empresa) q = q.ilike('empresa_nombre', `%${empresa}%`);
    if (año)     q = q.eq('año', Number(año));
    const { data, error } = await q;
    if (error) throw error;
    res.json(data ?? []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/vigia360/pat/:id/mes ──────────────────────────────────────
// Toggle a month's P or E status
vigia360Router.put('/pat/:id/mes', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { mes, tipo } = req.body as { mes: string; tipo: 'p' | 'e' };
    if (!MESES.includes(mes) || !['p','e'].includes(tipo))
      return res.status(400).json({ error: 'mes o tipo inválido' });

    const { data: actual } = await supabase.from('pat_actividades')
      .select('meses_programados,meses_ejecutados').eq('id', id).single();
    if (!actual) return res.status(404).json({ error: 'Actividad no encontrada' });

    const campo = tipo === 'p' ? 'meses_programados' : 'meses_ejecutados';
    const lista: string[] = actual[campo] ?? [];
    const nueva = lista.includes(mes) ? lista.filter((m: string) => m !== mes) : [...lista, mes];

    const { data, error } = await supabase.from('pat_actividades')
      .update({ [campo]: nueva, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/vigia360/pat/:id ──────────────────────────────────────────
vigia360Router.put('/pat/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { id: _id, created_at, ...campos } = req.body;
    const { data, error } = await supabase.from('pat_actividades')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/vigia360/pat ─────────────────────────────────────────────
vigia360Router.post('/pat', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('pat_actividades').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/vigia360/pat/:id ───────────────────────────────────────
vigia360Router.delete('/pat/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('pat_actividades')
      .update({ activo: false }).eq('id', Number(req.params.id));
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
