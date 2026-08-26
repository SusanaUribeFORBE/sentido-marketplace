import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import PDFDocument from 'pdfkit';

export const axaOrdenesRouter = Router();

type EstadoOrden = 'Aprobada' | 'PendienteEjecutar' | 'Ejecutada' | 'Facturada';

const CAMPOS = [
  'id','numero_orden','upr','nombre_trabajador','numero_afiliacion',
  'nombre_contacto','telefono_contacto','cargo_contacto',
  'tipo_servicio','codigo_actividad','ciudad_ejecucion',
  'cantidad','valor_unitario','valor_servicio',
  'fecha_aprobacion','fecha_vencimiento','fecha_ejecucion','fechas_ejecucion',
  'estado','numero_factura','fecha_facturacion',
  'tecnico_arl','consultor_asignado','observaciones','created_at',
];

// ── GET /api/axa/ordenes ─────────────────────────────────────────────
axaOrdenesRouter.get('/ordenes', async (req: Request, res: Response) => {
  try {
    let q = supabase
      .from('axa_ordenes')
      .select(CAMPOS.join(','))
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
      rows = rows.filter((r: any) =>
        r.numero_orden?.toLowerCase().includes(b) ||
        r.nombre_trabajador?.toLowerCase().includes(b) ||
        r.numero_factura?.toLowerCase().includes(b) ||
        r.consultor_asignado?.toLowerCase().includes(b) ||
        r.codigo_actividad?.toLowerCase().includes(b)
      );
    }

    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/axa/ordenes/exportar-csv ────────────────────────────────
axaOrdenesRouter.get('/ordenes/exportar-csv', async (req: Request, res: Response) => {
  try {
    let q = supabase.from('axa_ordenes').select(CAMPOS.join(',')).order('fecha_aprobacion', { ascending: false });
    const { buscar, estado, desde, hasta } = req.query as Record<string, string>;
    if (desde)  q = q.gte('fecha_aprobacion', desde);
    if (hasta)  q = q.lte('fecha_aprobacion', hasta);
    if (estado) q = q.eq('estado', estado);

    const { data, error } = await q;
    if (error) throw error;
    let rows = data ?? [];
    if (buscar) {
      const b = buscar.toLowerCase();
      rows = rows.filter((r: any) =>
        r.numero_orden?.toLowerCase().includes(b) ||
        r.nombre_trabajador?.toLowerCase().includes(b)
      );
    }

    const heads = ['N° Orden','UPR','Empresa Afiliada','N° Afiliación','Contacto','Teléfono','Cargo',
      'Cód. Actividad','Descripción','Ciudad','Cantidad','VR Unitario','VR Total',
      'F. Aprobación','F. Vencimiento','F. Ejecución','Estado','Técnico ARL',
      'Consultor','N° Factura','F. Facturación','Observaciones'];

    const lines = [
      heads.join(';'),
      ...rows.map((r: any) => [
        r.numero_orden, r.upr, r.nombre_trabajador, r.numero_afiliacion,
        r.nombre_contacto, r.telefono_contacto, r.cargo_contacto,
        r.codigo_actividad, r.tipo_servicio, r.ciudad_ejecucion,
        r.cantidad, r.valor_unitario, r.valor_servicio,
        r.fecha_aprobacion, r.fecha_vencimiento, r.fecha_ejecucion,
        r.estado, r.tecnico_arl, r.consultor_asignado,
        r.numero_factura, r.fecha_facturacion,
        (r.observaciones ?? '').replace(/;/g, ','),
      ].map(v => v ?? '').join(';'))
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ordenes-axa.csv"');
    res.send('﻿' + lines.join('\r\n'));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/axa/ordenes/:id/pdf ──────────────────────────────────────
axaOrdenesRouter.get('/ordenes/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { data: o, error } = await supabase
      .from('axa_ordenes').select('*').eq('id', id).single();
    if (error || !o) return res.status(404).json({ error: 'Orden no encontrada' });

    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Orden ${o.numero_orden}` } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden-${o.numero_orden}.pdf"`);
    doc.pipe(res);

    const M = 45;
    const W = 595 - M * 2;
    const co = (n: number) => `$ ${Number(n).toLocaleString('es-CO')}`;
    const fd = (d: string | null) => d ? d.split('-').reverse().join('/') : '—';
    const blk = (title: string, val: string, x: number, y: number, w: number) => {
      doc.font('Helvetica-Bold').fontSize(7).text(title, x, y, { width: w });
      doc.font('Helvetica').fontSize(8).text(val || '—', x, y + 9, { width: w });
    };

    // ── Header ─────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 72).fill('#00008F');
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(13)
       .text('AXA COLPATRIA', M, 14, { width: W, align: 'center' });
    doc.fontSize(10)
       .text('SEGUROS DE VIDA S.A', M, 30, { width: W, align: 'center' });
    doc.fontSize(8)
       .text(`ORDEN DE SERVICIO   EXTERNA NÚMERO:  ${o.numero_orden}`, M, 46, { width: W, align: 'center' });
    const uprTxt = o.upr ? `UPR: ${o.upr}` : '';
    doc.text(`${uprTxt}          ${fd(o.fecha_aprobacion)}`, M, 58, { width: W, align: 'center' });

    // ── Bloque izquierdo: Señores FORBE ──────────────────────────────
    let y = 88;
    doc.fill('#000000').font('Helvetica-Bold').fontSize(8).text('Señores:', M, y);
    doc.font('Helvetica').fontSize(8)
       .text('FORMACION DE BRIGADAS DE EMERGENCIA SAS', M, y + 11)
       .text('NIT/CED:  901048333', M, y + 21)
       .text('CARRERA 72 A 31  51', M, y + 31)
       .text('Telefono:  3008940799', M, y + 41)
       .text('MEDELLÍN', M, y + 51);

    // ── Bloque derecho: Empresa afiliada ──────────────────────────────
    const rx = M + 230;
    const rw = W - 230;
    doc.rect(rx - 5, y - 5, rw + 10, 80).strokeColor('#cccccc').lineWidth(0.5).stroke();
    blk('EMPRESA:', o.nombre_trabajador, rx, y, rw);
    blk('DIRECCIÓN:', '', rx, y + 18, rw);
    blk('PERSONA CONTACTO:', o.nombre_contacto, rx, y + 34, rw);
    blk('AFILIACIÓN No:', o.numero_afiliacion, rx + 100, y, 100);
    blk('TELÉFONO:', o.telefono_contacto, rx + 100, y + 18, 100);
    blk('CARGO:', o.cargo_contacto, rx + 100, y + 34, 100);
    blk('C.TRABAJO:', o.ciudad_ejecucion, rx + 100, y + 50, 100);

    // ── Texto introductorio ───────────────────────────────────────────
    y = 185;
    doc.fill('#000').font('Helvetica').fontSize(8)
       .text('Apreciados señores:', M, y)
       .text('Con la presente autorizamos la realización de los siguientes procedimientos.', M, y + 12);

    // ── Tabla de actividades ──────────────────────────────────────────
    y = 220;
    const cols = { act: 55, desc: 155, ciudad: 70, cant: 40, vru: 75, vriva: 55, vrtotal: 55 };
    const totalVr = Number(o.valor_servicio);
    const vrUnit  = Number(o.valor_unitario) || (o.cantidad ? totalVr / o.cantidad : 0);

    // Header tabla
    doc.rect(M, y, W, 16).fill('#333333');
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(7);
    let cx = M + 3;
    doc.text('ACTIVIDAD', cx, y + 5, { width: cols.act });   cx += cols.act;
    doc.text('DESCRIPCIÓN', cx, y + 5, { width: cols.desc }); cx += cols.desc;
    doc.text('CIUDAD EJECUCIÓN', cx, y + 5, { width: cols.ciudad }); cx += cols.ciudad;
    doc.text('CANTIDAD', cx, y + 5, { width: cols.cant, align: 'center' }); cx += cols.cant;
    doc.text('VR. UNITARIO', cx, y + 5, { width: cols.vru, align: 'right' }); cx += cols.vru;
    doc.text('VR IVA', cx, y + 5, { width: cols.vriva, align: 'right' }); cx += cols.vriva;
    doc.text('VR TOTAL', cx, y + 5, { width: cols.vrtotal, align: 'right' });

    // Fila datos
    y += 16;
    doc.rect(M, y, W, 18).fill('#f5f5f5').stroke();
    doc.fill('#000000').font('Helvetica').fontSize(8);
    cx = M + 3;
    doc.text(o.codigo_actividad || '', cx, y + 5, { width: cols.act });  cx += cols.act;
    doc.text(o.tipo_servicio || '', cx, y + 5, { width: cols.desc });     cx += cols.desc;
    doc.text(o.ciudad_ejecucion || '', cx, y + 5, { width: cols.ciudad }); cx += cols.ciudad;
    doc.text(String(o.cantidad || 1), cx, y + 5, { width: cols.cant, align: 'center' }); cx += cols.cant;
    doc.text(co(vrUnit), cx, y + 5, { width: cols.vru, align: 'right' }); cx += cols.vru;
    doc.text('', cx, y + 5, { width: cols.vriva, align: 'right' }); cx += cols.vriva;
    doc.text(co(totalVr), cx, y + 5, { width: cols.vrtotal, align: 'right' });

    // Fila TOTAL
    y += 18;
    doc.rect(M, y, W, 16).fill('#e8e8e8').stroke();
    doc.fill('#000').font('Helvetica-Bold').fontSize(8);
    doc.text('TOTAL', M + 3, y + 4, { width: cols.act + cols.desc + cols.ciudad + cols.cant });
    doc.text(String(o.cantidad || 1), M + 3 + cols.act + cols.desc + cols.ciudad, y + 4, { width: cols.cant, align: 'center' });
    doc.text(co(totalVr), M + 3 + cols.act + cols.desc + cols.ciudad + cols.cant + cols.vru + cols.vriva, y + 4, { width: cols.vrtotal, align: 'right' });

    // ── Observaciones ─────────────────────────────────────────────────
    y += 28;
    doc.rect(M, y, 100, 12).fill('#cccccc').stroke();
    doc.fill('#000').font('Helvetica-Bold').fontSize(7).text('OBSERVACIONES:', M + 3, y + 3);
    doc.font('Helvetica').fontSize(7.5)
       .text(o.observaciones || '', M + 105, y + 2, { width: W - 105 });

    // ── Fecha vencimiento ─────────────────────────────────────────────
    y += 30;
    doc.rect(M, y, 150, 12).fill('#cccccc').stroke();
    doc.fill('#000').font('Helvetica-Bold').fontSize(7)
       .text('FECHA VENCIMIENTO PARA PROGRAMACIÓN:', M + 3, y + 3);
    doc.font('Helvetica').fontSize(8).text(fd(o.fecha_vencimiento), M + 155, y + 2);

    // ── Consultor asignado ────────────────────────────────────────────
    y += 22;
    doc.font('Helvetica-Bold').fontSize(8)
       .text('CONSULTOR ASIGNADO FORBE SAS:', M, y);
    const consultorVal = o.consultor_asignado || '_______________________________';
    doc.font('Helvetica').text(consultorVal, M + 175, y);

    // ── Lineamientos AXA ──────────────────────────────────────────────
    y += 20;
    doc.rect(M, y, W, 38).fill('#f0f4ff').strokeColor('#00008F').lineWidth(0.5).stroke();
    doc.fill('#00008F').font('Helvetica-Bold').fontSize(7)
       .text('LINEAMIENTOS AXA COLPATRIA — SOPORTES PARA CIERRE DE ACTIVIDAD:', M + 5, y + 4);
    doc.fill('#333').font('Helvetica').fontSize(6.5)
       .text('ASE / EST (1-16h): Listado en Excel + Ficha técnica de gestión (PDF) + Aval técnico (PDF)', M + 5, y + 14)
       .text('ASE / EST (17h+): Listado en Excel + Informe técnico (PDF) + Aval técnico informe (PDF)', M + 5, y + 22)
       .text('DIS (1h+): Informe técnico (PDF) + Aval técnico informe (PDF)', M + 5, y + 30);

    // ── Firmas ────────────────────────────────────────────────────────
    y += 50;
    const fw = (W - 20) / 2;

    doc.font('Helvetica-Bold').fontSize(8).text(o.tecnico_arl || '', M, y, { width: fw, align: 'center' });
    doc.font('Helvetica').fontSize(7)
       .text('TÉCNICO EN SEGURIDAD INDUSTRIAL', M, y + 11, { width: fw, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(8)
       .text('DIRECTOR DE UNIDAD DE PREVENCIÓN DE RIESGOS', M + fw + 20, y, { width: fw, align: 'center' });

    y += 26;
    doc.moveTo(M + 30, y).lineTo(M + fw - 30, y).stroke();
    doc.moveTo(M + fw + 50, y).lineTo(M + W - 30, y).stroke();

    doc.font('Helvetica').fontSize(7)
       .text('PREAPROBACIÓN', M, y + 3, { width: fw, align: 'center' })
       .text('APROBACIÓN', M + fw + 20, y + 3, { width: fw, align: 'center' });

    // ── Footer ────────────────────────────────────────────────────────
    y += 25;
    doc.rect(0, y, 595, 30).fill('#00008F');
    doc.fill('#ffffff').font('Helvetica').fontSize(7)
       .text('AXA COLPATRIA · SEGUROS DE VIDA S.A · Documento generado por FORBE SAS', M, y + 11, { width: W, align: 'center' });

    doc.end();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/axa/ordenes ─────────────────────────────────────────────
axaOrdenesRouter.post('/ordenes', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    if (!b.numero_orden || !b.nombre_trabajador || !b.tipo_servicio || !b.valor_servicio || !b.fecha_aprobacion) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes.' });
    }
    const { data: dup } = await supabase.from('axa_ordenes').select('id')
      .eq('numero_orden', b.numero_orden.trim().toUpperCase()).maybeSingle();
    if (dup) return res.status(409).json({ error: `Ya existe la orden ${b.numero_orden}.` });

    const { data, error } = await supabase.from('axa_ordenes').insert(buildRow(b)).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/axa/ordenes/:id ──────────────────────────────────────────
axaOrdenesRouter.put('/ordenes/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    if (b.numero_orden) {
      const { data: dup } = await supabase.from('axa_ordenes').select('id')
        .eq('numero_orden', b.numero_orden.trim().toUpperCase()).neq('id', id).maybeSingle();
      if (dup) return res.status(409).json({ error: `Ya existe otra orden con N° ${b.numero_orden}.` });
    }
    const { data, error } = await supabase.from('axa_ordenes').update(buildRow(b, true)).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/axa/ordenes/:id/ejecutar ───────────────────────────────
axaOrdenesRouter.post('/ordenes/:id/ejecutar', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { data: o } = await supabase.from('axa_ordenes').select('estado').eq('id', id).single();
    if (!o) return res.status(404).json({ error: 'Orden no encontrada.' });
    if (!['Aprobada', 'PendienteEjecutar'].includes(o.estado))
      return res.status(422).json({ error: 'Solo se puede ejecutar una orden Aprobada o Pendiente.' });
    const hoy = new Date().toISOString().slice(0, 10);
    const { data: cur } = await supabase.from('axa_ordenes').select('fechas_ejecucion').eq('id', id).single();
    const prevFechas: string[] = cur?.fechas_ejecucion || [];
    const nuevasFechas = prevFechas.includes(hoy) ? prevFechas : [...prevFechas, hoy];
    const { data, error } = await supabase.from('axa_ordenes')
      .update({ estado: 'Ejecutada', fecha_ejecucion: hoy, fechas_ejecucion: nuevasFechas })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/axa/ordenes/:id/facturar ───────────────────────────────
axaOrdenesRouter.post('/ordenes/:id/facturar', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { numero_factura, fecha_facturacion } = req.body;
    if (!numero_factura || !fecha_facturacion)
      return res.status(400).json({ error: 'N° de factura y fecha son obligatorios.' });
    const { data: o } = await supabase.from('axa_ordenes').select('estado').eq('id', id).single();
    if (!o) return res.status(404).json({ error: 'Orden no encontrada.' });
    if (o.estado !== 'Ejecutada')
      return res.status(422).json({ error: 'Solo se puede facturar una orden Ejecutada.' });
    const { data, error } = await supabase.from('axa_ordenes')
      .update({ estado: 'Facturada', numero_factura: numero_factura.trim().toUpperCase(), fecha_facturacion })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/axa/ordenes/importar ────────────────────────────────────
axaOrdenesRouter.post('/ordenes/importar', async (req: Request, res: Response) => {
  try {
    const { filas } = req.body as { filas: Record<string, any>[] };
    if (!Array.isArray(filas) || !filas.length) return res.status(400).json({ error: 'No se enviaron filas.' });

    const parseDate = (v: any): string | null => {
      if (!v) return null;
      const s = String(v).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [d,m,y]=s.split('/'); return `${y}-${m}-${d}`; }
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const n = Number(v);
      if (!isNaN(n) && n > 40000) return new Date(Math.round((n-25569)*86400*1000)).toISOString().slice(0,10);
      return null;
    };

    const importadas: any[] = [];
    const errores: { fila: number; mensaje: string }[] = [];
    const ESTADOS = ['Aprobada','PendienteEjecutar','Ejecutada','Facturada'];

    for (let i=0; i<filas.length; i++) {
      const f = filas[i]; const fila = i+2;
      const numero_orden = String(f.numero_orden||'').trim().toUpperCase();
      const nombre_trabajador = String(f.nombre_trabajador||'').trim();
      const tipo_servicio = String(f.tipo_servicio||'').trim();
      const valor_servicio = Number(String(f.valor_servicio||'').replace(/[^0-9.]/g,''));
      const fecha_aprobacion = parseDate(f.fecha_aprobacion);

      if (!numero_orden)      { errores.push({fila,mensaje:'N° Orden vacío'}); continue; }
      if (!nombre_trabajador) { errores.push({fila,mensaje:`Fila ${fila}: Trabajador vacío`}); continue; }
      if (!tipo_servicio)     { errores.push({fila,mensaje:`Fila ${fila}: Tipo Servicio vacío`}); continue; }
      if (!valor_servicio)    { errores.push({fila,mensaje:`Fila ${fila}: Valor inválido`}); continue; }
      if (!fecha_aprobacion)  { errores.push({fila,mensaje:`Fila ${fila}: Fecha inválida`}); continue; }

      importadas.push({
        numero_orden, nombre_trabajador, tipo_servicio, valor_servicio, fecha_aprobacion,
        estado: ESTADOS.includes(f.estado) ? f.estado : 'Aprobada',
        upr: f.upr||null, numero_afiliacion: f.numero_afiliacion||null,
        nombre_contacto: f.nombre_contacto||null, telefono_contacto: f.telefono_contacto||null,
        codigo_actividad: f.codigo_actividad||null, ciudad_ejecucion: f.ciudad_ejecucion||null,
        cantidad: Number(f.cantidad)||1, valor_unitario: Number(f.valor_unitario)||0,
        tecnico_arl: f.tecnico_arl||null, observaciones: f.observaciones||null,
        fecha_vencimiento: parseDate(f.fecha_vencimiento),
      });
    }

    if (!importadas.length) return res.status(422).json({ importadas: 0, errores });

    let totalOk = 0;
    for (let i=0; i<importadas.length; i+=100) {
      const { error } = await supabase.from('axa_ordenes').upsert(importadas.slice(i,i+100), { onConflict:'numero_orden' });
      if (error) errores.push({fila:i+2, mensaje:error.message});
      else totalOk += Math.min(100, importadas.length-i);
    }
    res.json({ importadas: totalOk, errores });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/axa/ordenes/:id ───────────────────────────────────────
axaOrdenesRouter.delete('/ordenes/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('axa_ordenes').delete().eq('id', Number(req.params.id));
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── helper ────────────────────────────────────────────────────────────
function buildRow(b: any, partial = false): Record<string, any> {
  const r: Record<string, any> = {};
  const str = (v: any) => v ? String(v).trim() : null;
  const num = (v: any) => v !== undefined && v !== '' ? Number(v) : undefined;

  if (!partial || b.numero_orden)      r.numero_orden      = str(b.numero_orden)?.toUpperCase();
  if (!partial || b.nombre_trabajador) r.nombre_trabajador = str(b.nombre_trabajador);
  if (!partial || b.tipo_servicio)     r.tipo_servicio     = str(b.tipo_servicio);
  if (!partial || b.valor_servicio !== undefined) r.valor_servicio = num(b.valor_servicio);
  if (!partial || b.fecha_aprobacion)  r.fecha_aprobacion  = b.fecha_aprobacion || null;
  if (!partial || b.estado)            r.estado            = b.estado || 'Aprobada';

  const opt = ['upr','numero_afiliacion','nombre_contacto','telefono_contacto','cargo_contacto',
    'fecha_vencimiento','codigo_actividad','ciudad_ejecucion','tecnico_arl','consultor_asignado',
    'fecha_ejecucion','numero_factura','fecha_facturacion','observaciones'];
  for (const k of opt) {
    if (k in b) r[k] = b[k] || null;
  }
  if ('cantidad' in b) r.cantidad = num(b.cantidad) || 1;
  if ('valor_unitario' in b) r.valor_unitario = num(b.valor_unitario) || 0;
  if ('fechas_ejecucion' in b) r.fechas_ejecucion = Array.isArray(b.fechas_ejecucion) ? b.fechas_ejecucion : [];

  return r;
}
