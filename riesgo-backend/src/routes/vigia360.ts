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

// ══════════════════════════════════════════════════════════════════════
// PESV — Plan Estratégico de Seguridad Vial (Resolución 40595 de 2022)
// ══════════════════════════════════════════════════════════════════════

const PASOS_TEMPLATE = [
  { paso_numero: 1,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Líder del diseño e implementación del PESV' },
  { paso_numero: 2,  fase: 'PLANEAR',   aplica_nivel: 'estandar_avanzado', paso_nombre: 'Comité de seguridad vial' },
  { paso_numero: 3,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Política de Seguridad Vial de la Organización' },
  { paso_numero: 4,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Liderazgo, compromiso y corresponsabilidad del nivel directivo' },
  { paso_numero: 5,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Diagnóstico' },
  { paso_numero: 6,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Caracterización, evaluación y control de riesgos' },
  { paso_numero: 7,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Objetivos y metas del PESV' },
  { paso_numero: 8,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Programas de gestión de riesgos críticos y factores de desempeño' },
  { paso_numero: 9,  fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Plan anual de trabajo' },
  { paso_numero: 10, fase: 'PLANEAR',   aplica_nivel: 'todos',            paso_nombre: 'Competencia y plan anual de formación' },
  { paso_numero: 11, fase: 'HACER',     aplica_nivel: 'avanzado',         paso_nombre: 'Responsabilidad y comportamiento seguro' },
  { paso_numero: 12, fase: 'HACER',     aplica_nivel: 'todos',            paso_nombre: 'Plan de preparación y respuesta ante emergencias viales' },
  { paso_numero: 13, fase: 'HACER',     aplica_nivel: 'estandar_avanzado', paso_nombre: 'Investigación interna de siniestros viales' },
  { paso_numero: 14, fase: 'HACER',     aplica_nivel: 'todos',            paso_nombre: 'Vías seguras administradas por la organización' },
  { paso_numero: 15, fase: 'HACER',     aplica_nivel: 'todos',            paso_nombre: 'Planificación de desplazamientos laborales' },
  { paso_numero: 16, fase: 'HACER',     aplica_nivel: 'todos',            paso_nombre: 'Inspección de vehículos y equipos' },
  { paso_numero: 17, fase: 'HACER',     aplica_nivel: 'todos',            paso_nombre: 'Mantenimiento y control de vehículos seguros y equipos' },
  { paso_numero: 18, fase: 'HACER',     aplica_nivel: 'estandar_avanzado', paso_nombre: 'Gestión del cambio y gestión de contratistas' },
  { paso_numero: 19, fase: 'HACER',     aplica_nivel: 'estandar_avanzado', paso_nombre: 'Archivo y retención documental' },
  { paso_numero: 20, fase: 'VERIFICAR', aplica_nivel: 'todos',            paso_nombre: 'Indicadores y reporte de autogestión PESV' },
  { paso_numero: 21, fase: 'VERIFICAR', aplica_nivel: 'avanzado',         paso_nombre: 'Registro y análisis estadístico de siniestros viales' },
  { paso_numero: 22, fase: 'VERIFICAR', aplica_nivel: 'todos',            paso_nombre: 'Auditoría anual' },
  { paso_numero: 23, fase: 'ACTUAR',    aplica_nivel: 'todos',            paso_nombre: 'Mejora continua, acciones preventivas y correctivas' },
  { paso_numero: 24, fase: 'ACTUAR',    aplica_nivel: 'todos',            paso_nombre: 'Mecanismos de comunicación y participación' },
];

function pasosAplicables(nivel: string) {
  return PASOS_TEMPLATE.filter(p => {
    if (p.aplica_nivel === 'todos') return true;
    if (p.aplica_nivel === 'estandar_avanzado') return nivel === 'estandar' || nivel === 'avanzado';
    if (p.aplica_nivel === 'avanzado') return nivel === 'avanzado';
    return false;
  });
}

// ── GET /api/vigia360/pesv/empresas ────────────────────────────────────
vigia360Router.get('/pesv/empresas', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('pesv_pasos')
      .select('empresa_nombre,empresa_nit,año,nivel,misionalidad')
      .eq('activo', true)
      .eq('paso_numero', 1);
    if (error) throw error;
    res.json(data ?? []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/vigia360/pesv/empresas ───────────────────────────────────
vigia360Router.post('/pesv/empresas', async (req: Request, res: Response) => {
  try {
    const { empresa_nombre, empresa_nit, año, nivel, misionalidad } = req.body;
    if (!empresa_nombre || !nivel || !misionalidad) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const rows = pasosAplicables(nivel).map(p => ({
      empresa_nombre, empresa_nit, año: Number(año) || new Date().getFullYear(),
      nivel, misionalidad, ...p,
    }));
    const { error } = await supabase.from('pesv_pasos').insert(rows);
    if (error) throw error;
    res.status(201).json({ ok: true, pasos: rows.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/vigia360/pesv/pasos?empresa=X&año=Y ──────────────────────
vigia360Router.get('/pesv/pasos', async (req: Request, res: Response) => {
  try {
    const { empresa, año } = req.query as Record<string, string>;
    let q = supabase.from('pesv_pasos').select('*').eq('activo', true).order('paso_numero');
    if (empresa) q = q.ilike('empresa_nombre', `%${empresa}%`);
    if (año)     q = q.eq('año', Number(año));
    const { data, error } = await q;
    if (error) throw error;
    res.json(data ?? []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/vigia360/pesv/pasos/:id ──────────────────────────────────
vigia360Router.put('/pesv/pasos/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { completado, fecha_completado, responsable, evidencia, observaciones } = req.body;
    const { data, error } = await supabase.from('pesv_pasos')
      .update({ completado, fecha_completado: fecha_completado || null, responsable, evidencia, observaciones, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/vigia360/pesv/empresas ────────────────────────────────
vigia360Router.delete('/pesv/empresas', async (req: Request, res: Response) => {
  try {
    const { empresa, año } = req.body as { empresa: string; año: number };
    const { error } = await supabase.from('pesv_pasos')
      .update({ activo: false }).eq('empresa_nombre', empresa).eq('año', año);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
