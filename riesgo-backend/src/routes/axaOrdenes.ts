import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';

export const axaOrdenesRouter = Router();

type EstadoOrden = 'Aprobada' | 'PendienteEjecutar' | 'Ejecutada' | 'Facturada';

// ── GET /api/axa/ordenes ─────────────────────────────────────────────
axaOrdenesRouter.get('/ordenes', async (req: Request, res: Response) => {
  try {
    let q = supabase
      .from('axa_ordenes')
      .select('*')
      .order('fecha_aprobacion', { ascending: false });

    const { buscar, estado, desde, hasta } = req.query as Record<string, string>;

    if (desde)  q = q.gte('fecha_aprobacion', desde);
    if (hasta)  q = q.lte('fecha_aprobacion', hasta);
    if (estado) q = q.eq('estado', estado);

    const { data, error } = await q;
    if (error) throw error;

    let rows = data ?? [];
    if (buscar) {
      const b = buscar.toLowerCase();
      rows = rows.filter(r =>
        r.numero_orden?.toLowerCase().includes(b) ||
        r.nombre_trabajador?.toLowerCase().includes(b) ||
        r.numero_factura?.toLowerCase().includes(b)
      );
    }

    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/axa/ordenes ────────────────────────────────────────────
axaOrdenesRouter.post('/ordenes', async (req: Request, res: Response) => {
  try {
    const { numero_orden, nombre_trabajador, tipo_servicio,
            valor_servicio, fecha_aprobacion, estado, observaciones } = req.body;

    if (!numero_orden || !nombre_trabajador || !tipo_servicio || !valor_servicio || !fecha_aprobacion) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes.' });
    }

    // Verificar duplicado
    const { data: dup } = await supabase
      .from('axa_ordenes')
      .select('id')
      .eq('numero_orden', numero_orden.trim().toUpperCase())
      .maybeSingle();

    if (dup) return res.status(409).json({ error: `Ya existe una orden con el N° ${numero_orden}.` });

    const { data, error } = await supabase
      .from('axa_ordenes')
      .insert({
        numero_orden:      numero_orden.trim().toUpperCase(),
        nombre_trabajador: nombre_trabajador.trim(),
        tipo_servicio:     tipo_servicio.trim(),
        valor_servicio:    Number(valor_servicio),
        fecha_aprobacion,
        estado:            (estado as EstadoOrden) || 'Aprobada',
        observaciones:     observaciones?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/axa/ordenes/:id ─────────────────────────────────────────
axaOrdenesRouter.put('/ordenes/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { numero_orden, nombre_trabajador, tipo_servicio,
            valor_servicio, fecha_aprobacion, fecha_ejecucion,
            estado, numero_factura, fecha_facturacion, observaciones } = req.body;

    // Verificar duplicado excluyendo self
    if (numero_orden) {
      const { data: dup } = await supabase
        .from('axa_ordenes')
        .select('id')
        .eq('numero_orden', numero_orden.trim().toUpperCase())
        .neq('id', id)
        .maybeSingle();

      if (dup) return res.status(409).json({ error: `Ya existe otra orden con el N° ${numero_orden}.` });
    }

    const updates: Record<string, any> = {};
    if (numero_orden)      updates.numero_orden      = numero_orden.trim().toUpperCase();
    if (nombre_trabajador) updates.nombre_trabajador = nombre_trabajador.trim();
    if (tipo_servicio)     updates.tipo_servicio     = tipo_servicio.trim();
    if (valor_servicio !== undefined) updates.valor_servicio = Number(valor_servicio);
    if (fecha_aprobacion)  updates.fecha_aprobacion  = fecha_aprobacion;
    if (fecha_ejecucion !== undefined) updates.fecha_ejecucion = fecha_ejecucion || null;
    if (estado)            updates.estado            = estado;
    if (numero_factura !== undefined) updates.numero_factura = numero_factura?.trim().toUpperCase() || null;
    if (fecha_facturacion !== undefined) updates.fecha_facturacion = fecha_facturacion || null;
    if (observaciones !== undefined) updates.observaciones = observaciones?.trim() || null;

    const { data, error } = await supabase
      .from('axa_ordenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/axa/ordenes/:id/ejecutar ──────────────────────────────
axaOrdenesRouter.post('/ordenes/:id/ejecutar', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const { data: orden, error: ferr } = await supabase
      .from('axa_ordenes').select('estado').eq('id', id).single();
    if (ferr || !orden) return res.status(404).json({ error: 'Orden no encontrada.' });

    if (!['Aprobada', 'PendienteEjecutar'].includes(orden.estado)) {
      return res.status(422).json({ error: 'Solo se puede ejecutar una orden Aprobada o Pendiente.' });
    }

    const { data, error } = await supabase
      .from('axa_ordenes')
      .update({ estado: 'Ejecutada', fecha_ejecucion: new Date().toISOString().slice(0, 10) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/axa/ordenes/:id/facturar ──────────────────────────────
axaOrdenesRouter.post('/ordenes/:id/facturar', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { numero_factura, fecha_facturacion } = req.body;

    if (!numero_factura || !fecha_facturacion) {
      return res.status(400).json({ error: 'N° de factura y fecha son obligatorios.' });
    }

    const { data: orden, error: ferr } = await supabase
      .from('axa_ordenes').select('estado').eq('id', id).single();
    if (ferr || !orden) return res.status(404).json({ error: 'Orden no encontrada.' });

    if (orden.estado !== 'Ejecutada') {
      return res.status(422).json({ error: 'Solo se puede facturar una orden Ejecutada.' });
    }

    const { data, error } = await supabase
      .from('axa_ordenes')
      .update({
        estado:            'Facturada',
        numero_factura:    numero_factura.trim().toUpperCase(),
        fecha_facturacion,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/axa/ordenes/importar ──────────────────────────────────
axaOrdenesRouter.post('/ordenes/importar', async (req: Request, res: Response) => {
  try {
    const { filas } = req.body as { filas: Record<string, any>[] };
    if (!Array.isArray(filas) || filas.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas.' });
    }

    const parseDate = (v: any): string | null => {
      if (!v) return null;
      const s = String(v).trim();
      // DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        return `${y}-${m}-${d}`;
      }
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // Excel serial number
      const n = Number(v);
      if (!isNaN(n) && n > 40000) {
        const d = new Date(Math.round((n - 25569) * 86400 * 1000));
        return d.toISOString().slice(0, 10);
      }
      return null;
    };

    const ESTADOS_VALIDOS = ['Aprobada', 'PendienteEjecutar', 'Ejecutada', 'Facturada'];

    const importadas: any[] = [];
    const errores: { fila: number; mensaje: string }[] = [];

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      const fila = i + 2; // fila 1 = encabezados

      const numero_orden      = String(f.numero_orden || '').trim().toUpperCase();
      const nombre_trabajador = String(f.nombre_trabajador || '').trim();
      const tipo_servicio     = String(f.tipo_servicio || '').trim();
      const valor_servicio    = Number(String(f.valor_servicio || '').replace(/[^0-9.]/g, ''));
      const fecha_aprobacion  = parseDate(f.fecha_aprobacion);
      const estado            = ESTADOS_VALIDOS.includes(f.estado) ? f.estado : 'Aprobada';
      const observaciones     = String(f.observaciones || '').trim() || null;

      if (!numero_orden)      { errores.push({ fila, mensaje: 'N° Orden vacío' }); continue; }
      if (!nombre_trabajador) { errores.push({ fila, mensaje: `Fila ${fila}: Trabajador vacío` }); continue; }
      if (!tipo_servicio)     { errores.push({ fila, mensaje: `Fila ${fila}: Tipo Servicio vacío` }); continue; }
      if (!valor_servicio)    { errores.push({ fila, mensaje: `Fila ${fila}: Valor inválido` }); continue; }
      if (!fecha_aprobacion)  { errores.push({ fila, mensaje: `Fila ${fila}: Fecha Aprobación inválida` }); continue; }

      importadas.push({ numero_orden, nombre_trabajador, tipo_servicio, valor_servicio, fecha_aprobacion, estado, observaciones });
    }

    if (importadas.length === 0) {
      return res.status(422).json({ importadas: 0, errores });
    }

    // Insertar en lotes de 100
    let totalOk = 0;
    for (let i = 0; i < importadas.length; i += 100) {
      const lote = importadas.slice(i, i + 100);
      const { error } = await supabase.from('axa_ordenes').upsert(lote, { onConflict: 'numero_orden', ignoreDuplicates: false });
      if (error) {
        errores.push({ fila: i + 2, mensaje: error.message });
      } else {
        totalOk += lote.length;
      }
    }

    res.json({ importadas: totalOk, errores });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/axa/ordenes/:id ──────────────────────────────────────
axaOrdenesRouter.delete('/ordenes/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { error } = await supabase.from('axa_ordenes').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/axa/ordenes/exportar-csv ───────────────────────────────
axaOrdenesRouter.get('/ordenes/exportar-csv', async (req: Request, res: Response) => {
  try {
    let q = supabase.from('axa_ordenes').select('*').order('fecha_aprobacion', { ascending: false });
    const { buscar, estado, desde, hasta } = req.query as Record<string, string>;
    if (desde)  q = q.gte('fecha_aprobacion', desde);
    if (hasta)  q = q.lte('fecha_aprobacion', hasta);
    if (estado) q = q.eq('estado', estado);

    const { data, error } = await q;
    if (error) throw error;

    let rows = data ?? [];
    if (buscar) {
      const b = buscar.toLowerCase();
      rows = rows.filter(r =>
        r.numero_orden?.toLowerCase().includes(b) ||
        r.nombre_trabajador?.toLowerCase().includes(b) ||
        r.numero_factura?.toLowerCase().includes(b)
      );
    }

    const headers = ['N° Orden','Trabajador','Tipo Servicio','Valor','F. Aprobación','F. Ejecución','Estado','N° Factura','F. Facturación','Observaciones'];
    const lines = [
      headers.join(';'),
      ...rows.map(r => [
        r.numero_orden, r.nombre_trabajador, r.tipo_servicio,
        r.valor_servicio, r.fecha_aprobacion, r.fecha_ejecucion ?? '',
        r.estado, r.numero_factura ?? '', r.fecha_facturacion ?? '',
        (r.observaciones ?? '').replace(/;/g, ','),
      ].join(';'))
    ];

    const bom = '﻿';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ordenes-axa.csv"');
    res.send(bom + lines.join('\r\n'));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
