import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import multer from 'multer';
import { supabase } from '../supabase';
import PDFDocument from 'pdfkit';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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

// ── POST /api/axa/parsear-pdf ────────────────────────────────────────
axaOrdenesRouter.post('/parsear-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Falta el archivo PDF' });
  if (!anthropic) return res.status(503).json({ error: 'ANTHROPIC_API_KEY no configurada en Railway' });

  const pdfBase64 = req.file.buffer.toString('base64');

  const prompt = `Eres un extractor preciso de datos de órdenes de servicio AXA Colpatria / ARL.
Analiza el documento PDF y extrae los campos indicados EXACTAMENTE como aparecen.
Si un campo no está presente o no puedes leerlo con certeza: devuelve null. NO inventes ni deduzca datos.
Las fechas deben estar en formato YYYY-MM-DD. Los valores monetarios como número entero (sin puntos ni $).
"nombre_empresa" es la razón social o nombre de la empresa afiliada (cliente). "nombre_trabajador" es el nombre de la persona trabajadora si aparece por separado.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura, sin texto adicional:
{
  "numero_orden": null,
  "upr": null,
  "nombre_empresa": null,
  "nombre_trabajador": null,
  "numero_afiliacion": null,
  "nombre_contacto": null,
  "telefono_contacto": null,
  "cargo_contacto": null,
  "codigo_actividad": null,
  "tipo_servicio": null,
  "ciudad_ejecucion": null,
  "cantidad": null,
  "valor_unitario": null,
  "valor_servicio": null,
  "fecha_aprobacion": null,
  "fecha_vencimiento": null,
  "tecnico_arl": null,
  "observaciones": null
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No se pudo extraer datos del PDF' });

    const datos = JSON.parse(jsonMatch[0]);
    return res.json(datos);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Error procesando el PDF: ' + msg });
  }
});

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

    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `OS ${o.numero_orden}` } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="OS-${o.numero_orden}.pdf"`);
    doc.pipe(res);

    const M  = 40;
    const PW = 595;
    const W  = PW - M * 2;
    const AXA = '#00008F';
    const fd  = (d: string | null) => d ? d.split('-').reverse().join('/') : '—';

    // helpers
    const hdr = (label: string, val: string | null | undefined, x: number, y: number, w: number) => {
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#555555').text(label.toUpperCase(), x, y, { width: w });
      doc.font('Helvetica').fontSize(9).fillColor('#000000').text(val || '—', x, y + 10, { width: w, lineBreak: false });
    };
    const divider = (y: number) => {
      doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.4).strokeColor('#cccccc').stroke();
    };
    const sectionBar = (label: string, y: number): number => {
      doc.rect(M, y, W, 18).fill(AXA);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
         .text(label, M + 8, y + 5, { width: W - 16 });
      return y + 18;
    };

    // ── HEADER ────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 80).fill(AXA);
    // Título izquierda
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff')
       .text('FORBE SAS', M, 16);
    doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.8)')
       .text('FORMACIÓN DE BRIGADAS DE EMERGENCIA', M, 36)
       .text('NIT 901.048.333-3  ·  Medellín, Colombia', M, 48);
    // Etiqueta derecha
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
       .text('ASIGNACIÓN DE ORDEN DE SERVICIO', M, 18, { width: W, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFD600')
       .text(o.numero_orden || '', M, 32, { width: W, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.8)')
       .text('AXA COLPATRIA · SEGUROS DE VIDA S.A.', M, 58, { width: W, align: 'right' });

    // ── FILA REGIONAL / CIUDAD / FECHA / UPR ─────────────────────────
    let y = 96;
    hdr('Nombre Regional',  'REGIONAL ANTIOQUIA',    M,           y, 120);
    hdr('Ciudad Ejecución', o.ciudad_ejecucion,       M + 130,     y, 120);
    hdr('Fecha Asignación OS', fd(o.fecha_aprobacion), M + 270,   y, 120);
    hdr('UPR',              o.upr,                     M + 400,    y,  70);
    y += 32;
    divider(y); y += 10;

    // ── EMPRESA AFILIADA ─────────────────────────────────────────────
    y = sectionBar('EMPRESA AFILIADA', y); y += 8;
    hdr('Empresa',              o.nombre_trabajador,  M,       y, 260);
    hdr('# Afiliación Empresa', o.numero_afiliacion,  M + 280, y, 130);
    y += 32;

    // ── CONTACTO EMPRESA ─────────────────────────────────────────────
    y = sectionBar('CONTACTO EMPRESA', y); y += 8;
    hdr('Contacto Empresa', o.nombre_contacto,  M,       y, 200);
    hdr('Cargo',            o.cargo_contacto,   M + 220, y, 150);
    hdr('Teléfono / Celular', o.telefono_contacto, M + 390, y, 115);
    y += 32;

    // ── ACTIVIDAD ────────────────────────────────────────────────────
    y = sectionBar('ACTIVIDAD A EJECUTAR', y); y += 8;
    hdr('Código Actividad', o.codigo_actividad,  M,       y, 100);
    hdr('Actividad',        o.tipo_servicio,     M + 115, y, 250);
    hdr('Cantidad (Horas)', String(o.cantidad ?? '—'), M + 380, y, 80);
    y += 32;

    // Descripción detallada
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#555555')
       .text('DESCRIPCIÓN DETALLADA DE LA ACTIVIDAD', M, y);
    y += 11;
    const descText = o.observaciones || o.tipo_servicio || '—';
    const descH = Math.max(40, doc.heightOfString(descText, { width: W, fontSize: 9 }) + 8);
    doc.rect(M, y, W, descH).fillColor('#f7f8fc').fill();
    doc.rect(M, y, W, descH).strokeColor('#dde3f0').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#000000')
       .text(descText, M + 6, y + 6, { width: W - 12 });
    y += descH + 10;

    // ── CONSULTOR EJECUTOR ────────────────────────────────────────────
    y = sectionBar('CONSULTOR EJECUTOR', y); y += 10;
    const consultor = o.consultor_asignado || '';
    doc.font('Helvetica-Bold').fontSize(13).fillColor(AXA)
       .text(consultor || 'Por asignar', M, y, { width: W, align: 'center' });
    y += 24;

    // Línea de firma
    divider(y); y += 14;
    const fw2 = (W - 30) / 2;
    doc.moveTo(M + 20, y + 28).lineTo(M + fw2 - 10, y + 28).strokeColor('#888').lineWidth(0.7).stroke();
    doc.moveTo(M + fw2 + 40, y + 28).lineTo(M + W - 20, y + 28).strokeColor('#888').lineWidth(0.7).stroke();

    doc.font('Helvetica').fontSize(7).fillColor('#555')
       .text('Firma Consultor / Aceptación', M, y + 32, { width: fw2, align: 'center' })
       .text('Firma Coordinadora FORBE SAS', M + fw2 + 30, y + 32, { width: fw2, align: 'center' });

    // Campo Fecha de Recibido
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#555')
       .text('Fecha de recibido: _______ / _______ / _______', M, y + 46, { width: W, align: 'center' });
    y += 65;

    // ── LINEAMIENTOS ─────────────────────────────────────────────────
    doc.rect(M, y, W, 36).fillColor('#f0f4ff').fill();
    doc.rect(M, y, W, 36).strokeColor(AXA).lineWidth(0.4).stroke();
    doc.font('Helvetica-Bold').fontSize(7).fillColor(AXA)
       .text('SOPORTES PARA CIERRE DE ACTIVIDAD — AXA COLPATRIA:', M + 6, y + 5);
    doc.font('Helvetica').fontSize(6.5).fillColor('#333')
       .text('ASE / EST (1–16h): Listado en Excel · Ficha técnica de gestión (PDF) · Aval técnico (PDF)', M + 6, y + 15)
       .text('ASE / EST (17h+): Listado en Excel · Informe técnico (PDF) · Aval técnico informe (PDF)', M + 6, y + 23)
       .text('DIS (1h+): Informe técnico (PDF) · Aval técnico informe (PDF)', M + 6, y + 31);
    y += 46;

    // ── FOOTER ────────────────────────────────────────────────────────
    doc.rect(0, 762, PW, 80).fillColor(AXA).fill();
    doc.font('Helvetica').fontSize(7).fillColor('rgba(255,255,255,0.7)')
       .text(`Generado por FORBE SAS · ${new Date().toLocaleDateString('es-CO')} · Técnico ARL: ${o.tecnico_arl || '—'}`,
             M, 772, { width: W, align: 'center' });

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
