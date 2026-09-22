import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
    const { completado, fecha_completado, responsable, evidencia, observaciones, representante_legal, cargo_representante } = req.body;
    const { data, error } = await supabase.from('pesv_pasos')
      .update({ completado, fecha_completado: fecha_completado || null, responsable, evidencia, observaciones,
                representante_legal: representante_legal || null, cargo_representante: cargo_representante || null,
                updated_at: new Date().toISOString() })
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

// ── GET /api/vigia360/pesv/documento?paso=N&empresa=X&año=Y ──────────
vigia360Router.get('/pesv/documento', async (req: Request, res: Response) => {
  try {
    const { paso: pasoStr, empresa, año } = req.query as Record<string, string>;
    const pasoNum = Number(pasoStr);

    const [{ data: pasoData }, { data: paso1Data }] = await Promise.all([
      supabase.from('pesv_pasos').select('*')
        .ilike('empresa_nombre', `%${empresa}%`).eq('año', Number(año))
        .eq('paso_numero', pasoNum).eq('activo', true).maybeSingle(),
      supabase.from('pesv_pasos').select('representante_legal,cargo_representante,empresa_nombre,empresa_nit')
        .ilike('empresa_nombre', `%${empresa}%`).eq('año', Number(año))
        .eq('paso_numero', 1).eq('activo', true).maybeSingle(),
    ]);

    const template = PASOS_TEMPLATE.find(p => p.paso_numero === pasoNum);
    if (!template) return res.status(400).json({ error: 'Paso no válido' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="PESV_Paso${String(pasoNum).padStart(2,'0')}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margins: { top: 36, bottom: 36, left: 36, right: 36 } });
    doc.pipe(res);

    const ctx: PESVCtx = {
      empresa:       paso1Data?.empresa_nombre  || empresa || '___________________________',
      nit:           paso1Data?.empresa_nit     || '___________________________',
      año:           Number(año),
      responsable:   pasoData?.responsable      || '___________________________',
      representante: paso1Data?.representante_legal   || '___________________________',
      cargo:         paso1Data?.cargo_representante   || 'Representante Legal',
      fecha:         pasoData?.fecha_completado
                       ? fmtFecha(pasoData.fecha_completado)
                       : fmtFecha(new Date().toISOString().slice(0, 10)),
      pasoNum,
      titulo:        TITULOS_DOC[pasoNum] || template.paso_nombre.toUpperCase(),
      codigo:        `PESV-F${String(pasoNum).padStart(3,'0')}`,
    };

    pesv_dibujarPagina1(doc, ctx);
    doc.addPage();
    pesv_dibujarControlCambios(doc, ctx);
    doc.end();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════
// Utilidades PDF — PESV
// ══════════════════════════════════════════════════════════════════════

interface PESVCtx {
  empresa: string; nit: string; año: number;
  responsable: string; representante: string; cargo: string;
  fecha: string; pasoNum: number; titulo: string; codigo: string;
}

const TITULOS_DOC: Record<number, string> = {
  1:  'ACTA DE NOMBRAMIENTO Y DESIGNACIÓN LÍDER PESV',
  2:  'ACTA DE CONFORMACIÓN COMITÉ DE SEGURIDAD VIAL',
  3:  'POLÍTICA DE SEGURIDAD VIAL DE LA ORGANIZACIÓN',
  4:  'ACTA DE COMPROMISO DE LA ALTA DIRECCIÓN',
  5:  'FORMATO DE DIAGNÓSTICO INICIAL PESV',
  6:  'MATRIZ DE CARACTERIZACIÓN Y CONTROL DE RIESGOS VIALES',
  7:  'OBJETIVOS Y METAS DEL PESV',
  8:  'PROGRAMAS DE GESTIÓN DE RIESGOS CRÍTICOS',
  9:  'PLAN ANUAL DE TRABAJO PESV',
  10: 'PLAN ANUAL DE FORMACIÓN Y COMPETENCIAS',
  11: 'REGLAMENTO DE COMPORTAMIENTO SEGURO EN LA VÍA',
  12: 'PLAN DE PREPARACIÓN Y RESPUESTA ANTE EMERGENCIAS VIALES',
  13: 'FORMATO DE INVESTIGACIÓN INTERNA DE SINIESTROS VIALES',
  14: 'INSPECCIÓN DE VÍAS ADMINISTRADAS POR LA ORGANIZACIÓN',
  15: 'PLANIFICACIÓN DE DESPLAZAMIENTOS LABORALES',
  16: 'FORMATO DE INSPECCIÓN DE VEHÍCULOS Y EQUIPOS',
  17: 'PROGRAMA DE MANTENIMIENTO DE VEHÍCULOS Y EQUIPOS',
  18: 'GESTIÓN DEL CAMBIO Y GESTIÓN DE CONTRATISTAS',
  19: 'TABLA DE RETENCIÓN DOCUMENTAL PESV',
  20: 'FICHA DE INDICADORES Y REPORTE DE AUTOGESTIÓN PESV',
  21: 'REGISTRO Y ANÁLISIS ESTADÍSTICO DE SINIESTROS VIALES',
  22: 'PROGRAMA DE AUDITORÍA ANUAL PESV',
  23: 'PLAN DE MEJORA CONTINUA, ACCIONES PREVENTIVAS Y CORRECTIVAS',
  24: 'MECANISMOS DE COMUNICACIÓN Y PARTICIPACIÓN',
};

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'logo-proaves.jpeg');

function pesv_dibujarEncabezado(doc: PDFKit.PDFDocument, ctx: PESVCtx) {
  const X = 36, Y = doc.y, W = 523, H = 110;
  const logoW = 130, codeW = 138;
  const titleW = W - logoW - codeW;

  // Outer border + vertical dividers
  doc.rect(X, Y, W, H).stroke('#333');
  doc.moveTo(X + logoW, Y).lineTo(X + logoW, Y + H).stroke('#333');
  doc.moveTo(X + logoW + titleW, Y).lineTo(X + logoW + titleW, Y + H).stroke('#333');

  // Logo — fit escala manteniendo relación de aspecto dentro de la celda
  const logoExists = fs.existsSync(LOGO_PATH);
  if (logoExists) {
    doc.image(LOGO_PATH, X + 6, Y + 6, { fit: [logoW - 12, H - 12] });
  } else {
    doc.fontSize(7).font('Helvetica-Bold')
      .text(ctx.empresa, X + 4, Y + H / 2 - 8, { width: logoW - 8, align: 'center' });
  }

  // Title — centrado vertical en la celda central
  const approxLines = Math.ceil(ctx.titulo.length / 25);
  const titleY = Y + Math.max(14, (H - approxLines * 12) / 2);
  doc.fontSize(9).font('Helvetica-Bold')
    .text(ctx.titulo, X + logoW + 6, titleY, {
      width: titleW - 12, align: 'center', lineGap: 4,
    });

  // Code block (celda derecha)
  const cx = X + logoW + titleW + 7;
  doc.fontSize(7.5).font('Helvetica-Bold')
    .text(`CÓDIGO: ${ctx.codigo}`, cx, Y + 16, { width: codeW - 14 })
    .text('VERSIÓN: 1',             cx, Y + 34, { width: codeW - 14 })
    .text('FECHA DE VIGENCIA:',     cx, Y + 52, { width: codeW - 14 })
    .text(ctx.fecha,                cx, Y + 67, { width: codeW - 14 });

  doc.y = Y + H + 20;
}

function pesv_firmas(doc: PDFKit.PDFDocument, ctx: PESVCtx, labelIzq: string, labelDer: string) {
  const X = 36, W = 523;
  const col = W / 2 - 24;
  const colR = X + W / 2 + 24;

  // Empujar firmas hacia abajo para usar el espacio de la página
  const pageH = 841.89;
  const bottomMargin = 36;
  const sigBlockH = 90;
  const targetY = pageH - bottomMargin - sigBlockH;
  const sigY = Math.max(doc.y + 50, targetY);

  // Líneas de firma
  doc.moveTo(X, sigY).lineTo(X + col, sigY).stroke('#999');
  doc.moveTo(colR, sigY).lineTo(X + W, sigY).stroke('#999');

  doc.fontSize(9).font('Helvetica-Bold')
    .text(ctx.representante, X, sigY + 6, { width: col })
    .text(ctx.responsable,   colR, sigY + 6, { width: col });
  doc.fontSize(8).font('Helvetica')
    .text(ctx.cargo,  X,    sigY + 20, { width: col })
    .text('Líder PESV', colR, sigY + 20, { width: col });
  doc.fontSize(8).font('Helvetica')
    .text(ctx.empresa, X,    sigY + 32, { width: col })
    .text(ctx.empresa, colR, sigY + 32, { width: col });
  doc.fontSize(8).font('Helvetica-Bold')
    .text(labelIzq, X,    sigY + 46, { width: col })
    .text(labelDer, colR, sigY + 46, { width: col });

  doc.y = sigY + 70;
}

function pesv_dibujarPagina1(doc: PDFKit.PDFDocument, ctx: PESVCtx) {
  pesv_dibujarEncabezado(doc, ctx);

  const X = 36, W = 523;
  const body: Record<number, () => void> = {
    1: () => {
      doc.moveDown(1.5);
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`___________, ${ctx.fecha}`, X, doc.y, { width: W, align: 'right' });
      doc.moveDown(2);

      // Párrafo principal de designación
      doc.fontSize(11).font('Helvetica')
        .text('Por medio de la presente, yo ', X, doc.y, { width: W, align: 'justify', continued: true, lineGap: 6 })
        .font('Helvetica-Bold').text(ctx.representante, { continued: true })
        .font('Helvetica').text(
          ', identificada con Cédula de Ciudadanía No. _______________ de ___________, ' +
          'actuando en mi calidad de ',
          { continued: true }
        )
        .font('Helvetica-Bold').text(ctx.cargo, { continued: true })
        .font('Helvetica').text(' de la ', { continued: true })
        .font('Helvetica-Bold').text(ctx.empresa, { continued: true })
        .font('Helvetica').text(
          ` (NIT: ${ctx.nit}), en cumplimiento de lo establecido en la Resolución ` +
          '20223040040595 del Ministerio de Transporte, designo como Líder del diseño e ' +
          'implementación del Plan Estratégico de Seguridad Vial (PESV) a ',
          { continued: true }
        )
        .font('Helvetica-Bold').text(ctx.responsable, { continued: true })
        .font('Helvetica').text(
          ', quien tendrá la responsabilidad de velar por el cumplimiento de las etapas de ' +
          'planificación, implementación, seguimiento y mejora continua del PESV de conformidad ' +
          'con la Resolución 20223040040595 del Ministerio de Transporte y demás normatividad ' +
          'nacional vigente en materia de seguridad vial, así mismo el reporte de los indicadores ' +
          'del PESV ante las entidades correspondientes, e informará a la Alta Dirección sobre el ' +
          'funcionamiento y los resultados del Plan.',
          { width: W, align: 'justify', lineGap: 6 }
        );

      doc.moveDown(2);

      // Funciones del Líder PESV
      doc.fontSize(11).font('Helvetica')
        .text('El Líder del PESV designado tendrá, entre otras, las siguientes funciones:', X, doc.y, { width: W, lineGap: 6 });
      doc.moveDown(0.8);
      const funciones = [
        'Coordinar la elaboración, implementación y actualización del Plan Estratégico de Seguridad Vial.',
        'Reportar periódicamente a la Alta Dirección los avances, resultados e indicadores del PESV.',
        'Gestionar y hacer seguimiento a los indicadores de siniestralidad vial de la organización.',
        'Promover la cultura de seguridad vial en todos los niveles de la organización.',
        'Articular con las entidades competentes el cumplimiento de la normatividad vigente en seguridad vial.',
      ];
      funciones.forEach((f, i) => {
        doc.fontSize(11).font('Helvetica')
          .text(`${i + 1}. ${f}`, X + 15, doc.y, { width: W - 15, align: 'justify', lineGap: 5 })
          .moveDown(0.5);
      });

      doc.moveDown(1.2);
      doc.fontSize(11).font('Helvetica').text(
        'La presente designación tiene vigencia a partir de la fecha de su firma y hasta tanto la Alta Dirección de la organización determine lo contrario.',
        X, doc.y, { width: W, align: 'justify', lineGap: 6 }
      );

      pesv_firmas(doc, ctx, ctx.cargo + '\nFIRMA DE APROBACIÓN', 'FIRMA DE ACEPTACIÓN DEL LÍDER DEL PESV');
    },
    2: () => {
      doc.fontSize(9).font('Helvetica-Bold').text(`Rionegro, ${ctx.fecha}`, X, doc.y).moveDown(0.8);
      doc.fontSize(9).font('Helvetica').text(
        `Por medio de la presente acta, se deja constancia de la conformación del Comité de Seguridad Vial de ${ctx.empresa} (NIT: ${ctx.nit}), en cumplimiento del artículo 2° de la Resolución 20223040040595 del Ministerio de Transporte.\n\nEl Comité estará integrado por la Alta Dirección, el Líder del PESV y los representantes de las áreas involucradas en la gestión vial. Tendrá la responsabilidad de apoyar la implementación, seguimiento y revisión periódica del Plan Estratégico de Seguridad Vial.\n\nEl Comité se reunirá con una frecuencia mínima trimestral y dejará constancia de sus sesiones mediante actas debidamente firmadas.`,
        X, doc.y, { width: W, align: 'justify', lineGap: 2 }
      );
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica-Bold').text('INTEGRANTES DEL COMITÉ:', X, doc.y).moveDown(0.5);
      const thY = doc.y;
      const cols = [200, 160, 130];
      const headers = ['Nombre completo', 'Cargo en la empresa', 'Firma'];
      let cx2 = X;
      headers.forEach((h, i) => {
        doc.rect(cx2, thY, cols[i], 18).fillAndStroke('#1A237E', '#333');
        doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(h, cx2 + 3, thY + 5, { width: cols[i] - 6 });
        cx2 += cols[i];
      });
      doc.fillColor('#000');
      for (let r = 0; r < 5; r++) {
        const ry = thY + 18 + r * 22;
        cx2 = X;
        cols.forEach(cw => { doc.rect(cx2, ry, cw, 22).stroke('#CCC'); cx2 += cw; });
      }
      doc.y = thY + 18 + 5 * 22 + 12;
      pesv_firmas(doc, ctx, 'Representante Legal\nFIRMA DE APROBACIÓN', 'Líder PESV\nFIRMA DE ELABORACIÓN');
    },
    3: () => {
      doc.fontSize(9).font('Helvetica-Bold').text(`${ctx.empresa}`, X, doc.y).moveDown(0.3);
      doc.fontSize(9).font('Helvetica').text(
        `${ctx.empresa} (NIT: ${ctx.nit}), comprometida con la seguridad vial y el bienestar de sus colaboradores, contratistas, clientes y comunidad en general, adopta la siguiente política de seguridad vial:\n\n`,
        X, doc.y, { width: W, align: 'justify' }
      );
      doc.fontSize(9).font('Helvetica-Bold').text('POLÍTICA DE SEGURIDAD VIAL', X, doc.y, { width: W, align: 'center' }).moveDown(0.5);
      doc.fontSize(9).font('Helvetica').text(
        `"En ${ctx.empresa} nos comprometemos a prevenir los accidentes de tránsito, proteger la vida de todas las personas que hacen parte de nuestras operaciones y contribuir a la seguridad vial del país. Para ello implementamos el Plan Estratégico de Seguridad Vial conforme a la Resolución 20223040040595 del Ministerio de Transporte, promovemos una cultura de respeto por las normas de tránsito, garantizamos la idoneidad de nuestros conductores y el buen estado de nuestros vehículos, y gestionamos los riesgos viales de forma sistemática y continua."`,
        X, doc.y, { width: W, align: 'justify', lineGap: 2 }
      );
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').text('Esta política aplica a todos los colaboradores, contratistas y terceros que realicen desplazamientos en nombre de la organización. Será revisada anualmente y comunicada a todas las partes interesadas.', X, doc.y, { width: W, align: 'justify' });
      pesv_firmas(doc, ctx, 'Representante Legal\nFIRMA DE APROBACIÓN', 'Líder PESV\nFIRMA DE ELABORACIÓN');
    },
    4: () => {
      doc.fontSize(9).font('Helvetica-Bold').text(`___________, ${ctx.fecha}`, X, doc.y).moveDown(1);
      doc.fontSize(9).font('Helvetica').text(
        `Por medio de la presente, la Alta Dirección de `,
        X, doc.y, { width: W, align: 'justify', continued: true }
      ).font('Helvetica-Bold').text(ctx.empresa, { continued: true })
       .font('Helvetica').text(
        ` (NIT: ${ctx.nit}), representada por `,
        { continued: true }
      ).font('Helvetica-Bold').text(ctx.representante, { continued: true })
       .font('Helvetica').text(
        ` en calidad de ${ctx.cargo}, manifiesta su pleno compromiso con la implementación, mantenimiento y mejora continua del Plan Estratégico de Seguridad Vial (PESV), en cumplimiento de la Resolución 20223040040595 del Ministerio de Transporte.`,
        { width: W, align: 'justify' }
      );
      doc.moveDown(0.8);
      doc.fontSize(9).font('Helvetica').text('En consecuencia, la organización se compromete a:', X, doc.y, { width: W }).moveDown(0.5);
      const compromisos = [
        'Asignar los recursos humanos, técnicos y financieros necesarios para la implementación del PESV.',
        'Designar el Líder del PESV con las competencias requeridas por la resolución.',
        'Promover una cultura de seguridad vial en todos los niveles de la organización.',
        'Revisar periódicamente el cumplimiento del PESV y tomar las acciones de mejora necesarias.',
        'Reportar oportunamente los indicadores de autogestión ante las entidades competentes.',
        'Cumplir con toda la normatividad vigente en materia de seguridad vial.',
      ];
      compromisos.forEach((c, i) => {
        doc.fontSize(9).font('Helvetica').text(`${i + 1}. ${c}`, X + 10, doc.y, { width: W - 10, align: 'justify' }).moveDown(0.3);
      });
      pesv_firmas(doc, ctx, ctx.cargo + '\nFIRMA DE COMPROMISO', 'Líder PESV\nFIRMA DE ELABORACIÓN');
    },
  };

  if (body[ctx.pasoNum]) {
    body[ctx.pasoNum]();
  } else {
    pesv_cuerpoGenerico(doc, ctx);
  }
}

function pesv_cuerpoGenerico(doc: PDFKit.PDFDocument, ctx: PESVCtx) {
  const X = 36, W = 523;
  const OBJETIVOS: Record<number, string> = {
    5:  'Establecer la línea base del estado actual de la organización frente a los requisitos de la Resolución 20223040040595, identificando brechas y oportunidades de mejora para el diseño del PESV.',
    6:  'Identificar, caracterizar, evaluar y establecer controles para los riesgos viales asociados a los desplazamientos laborales, garantizando la gestión sistemática de los peligros en la vía.',
    7:  'Definir los objetivos estratégicos y metas medibles del PESV, alineados con la política de seguridad vial y los resultados del diagnóstico inicial.',
    8:  'Diseñar e implementar los programas de intervención sobre los riesgos críticos y factores de desempeño identificados en el diagnóstico y la matriz de riesgos viales.',
    9:  'Planificar las actividades del PESV para el período anual, estableciendo responsables, recursos, fechas y mecanismos de seguimiento.',
    10: 'Garantizar la competencia de los conductores y demás personal que interviene en la gestión vial, mediante un plan estructurado de formación, sensibilización y evaluación.',
    11: 'Establecer las normas de comportamiento vial que deben cumplir todos los colaboradores y contratistas de la organización durante los desplazamientos laborales.',
    12: 'Preparar a la organización para dar respuesta eficaz ante siniestros viales, minimizando el impacto sobre las personas y la continuidad del negocio.',
    13: 'Investigar internamente los siniestros viales para identificar causas raíz, factores contribuyentes y establecer acciones correctivas y preventivas.',
    14: 'Garantizar las condiciones adecuadas de seguridad en las vías administradas o habilitadas por la organización para el tránsito de personas y vehículos.',
    15: 'Planificar los desplazamientos laborales minimizando la exposición al riesgo vial mediante la selección de rutas seguras, horarios apropiados y medios de transporte idóneos.',
    16: 'Verificar periódicamente las condiciones técnicas y de seguridad de los vehículos y equipos utilizados en los desplazamientos laborales.',
    17: 'Asegurar el mantenimiento preventivo y correctivo de los vehículos y equipos, garantizando su confiabilidad y condiciones seguras de operación.',
    18: 'Gestionar los cambios en la organización y las relaciones con contratistas asegurando que no se incremente el riesgo vial.',
    19: 'Establecer los criterios y tiempos de retención de los documentos generados en el marco del PESV, garantizando la trazabilidad y disponibilidad de la información.',
    20: 'Medir y hacer seguimiento al desempeño del PESV mediante indicadores de gestión, resultado e impacto, y reportar la autogestión ante el Ministerio de Transporte.',
    21: 'Registrar, analizar estadísticamente y difundir la información de los siniestros viales para orientar la toma de decisiones y las acciones de mejora.',
    22: 'Evaluar de forma sistemática e independiente el grado de implementación y eficacia del PESV, identificando oportunidades de mejora.',
    23: 'Implementar un proceso sistemático de mejora continua a partir de los hallazgos de auditorías, indicadores, siniestros e inconformidades del PESV.',
    24: 'Establecer los canales y mecanismos para la comunicación interna y externa del PESV, y garantizar la participación activa de los colaboradores en la seguridad vial.',
  };

  doc.fontSize(9).font('Helvetica-Bold').text('OBJETIVO', X, doc.y).moveDown(0.3);
  doc.fontSize(9).font('Helvetica')
    .text(OBJETIVOS[ctx.pasoNum] || 'Dar cumplimiento al paso ' + ctx.pasoNum + ' del PESV conforme a la Resolución 20223040040595 del Ministerio de Transporte.', X, doc.y, { width: W, align: 'justify' })
    .moveDown(1);

  doc.fontSize(9).font('Helvetica-Bold').text('ALCANCE', X, doc.y).moveDown(0.3);
  doc.fontSize(9).font('Helvetica')
    .text(`Aplica a ${ctx.empresa} (NIT: ${ctx.nit}) y a todos sus colaboradores, contratistas y partes interesadas que intervienen en los desplazamientos laborales en el año ${ctx.año}.`, X, doc.y, { width: W, align: 'justify' })
    .moveDown(1);

  doc.fontSize(9).font('Helvetica-Bold').text('RESPONSABLE', X, doc.y).moveDown(0.3);
  doc.fontSize(9).font('Helvetica').text(ctx.responsable || '___________________________', X, doc.y, { width: W }).moveDown(1);

  doc.fontSize(9).font('Helvetica-Bold').text('FECHA DE IMPLEMENTACIÓN', X, doc.y).moveDown(0.3);
  doc.fontSize(9).font('Helvetica').text(ctx.fecha, X, doc.y, { width: W }).moveDown(1);

  doc.fontSize(9).font('Helvetica-Bold').text('EVIDENCIAS / DOCUMENTOS ASOCIADOS', X, doc.y).moveDown(0.4);
  const thY = doc.y;
  const cols2 = [280, 123, 120];
  const heads2 = ['Documento / Evidencia', 'Fecha', 'Observaciones'];
  let cx = X;
  heads2.forEach((h, i) => {
    doc.rect(cx, thY, cols2[i], 18).fillAndStroke('#1A237E', '#333');
    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(h, cx + 3, thY + 5, { width: cols2[i] - 6 });
    cx += cols2[i];
  });
  doc.fillColor('#000');
  for (let r = 0; r < 4; r++) {
    const ry = thY + 18 + r * 20;
    cx = X;
    cols2.forEach(cw => { doc.rect(cx, ry, cw, 20).stroke('#CCC'); cx += cw; });
  }
  doc.y = thY + 18 + 4 * 20 + 12;

  pesv_firmas(doc, ctx, 'Representante Legal\nFIRMA DE APROBACIÓN', 'Líder PESV\nFIRMA DE ELABORACIÓN');
}

function pesv_dibujarControlCambios(doc: PDFKit.PDFDocument, ctx: PESVCtx) {
  pesv_dibujarEncabezado(doc, ctx);
  const X = 36, W = 523;

  // Control de cambios
  doc.fontSize(9).font('Helvetica-Bold').text('CONTROL DE CAMBIOS', X, doc.y, { width: W, align: 'center' }).moveDown(0.5);

  const thY = doc.y;
  const cols = [80, 120, 323];
  const heads = ['VERSIÓN', 'FECHA DE APROBACIÓN', 'DESCRIPCIÓN DE CAMBIOS REALIZADOS'];
  let cx = X;
  heads.forEach((h, i) => {
    doc.rect(cx, thY, cols[i], 20).fillAndStroke('#1A237E', '#333');
    doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text(h, cx + 3, thY + 6, { width: cols[i] - 6, align: 'center' });
    cx += cols[i];
  });
  const dataY = thY + 20;
  cx = X;
  const rowData = ['01', ctx.fecha, 'No aplica por ser primera versión'];
  rowData.forEach((val, i) => {
    doc.rect(cx, dataY, cols[i], 20).fillAndStroke('#fff', '#CCC');
    doc.fillColor('#000').fontSize(8).font('Helvetica').text(val, cx + 3, dataY + 5, { width: cols[i] - 6, align: 'center' });
    cx += cols[i];
  });
  doc.fillColor('#000');
  doc.y = dataY + 20 + 20;

  // Elaboró / Aprobó
  const eY = doc.y;
  const half = W / 2;
  doc.rect(X, eY, half, 20).fillAndStroke('#1A237E', '#333');
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text('ELABORÓ:', X + 4, eY + 6);
  doc.rect(X + half, eY, half, 20).fillAndStroke('#1A237E', '#333');
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text('REVISÓ Y APROBÓ:', X + half + 4, eY + 6);
  doc.fillColor('#000');

  const r2Y = eY + 20;
  doc.rect(X, r2Y, half, 50).stroke('#CCC');
  doc.rect(X + half, r2Y, half, 50).stroke('#CCC');
  doc.fontSize(8).font('Helvetica-Bold')
    .text(ctx.responsable, X + 4, r2Y + 5, { width: half - 8 })
    .text(ctx.representante, X + half + 4, r2Y + 5, { width: half - 8 });
  doc.fontSize(7).font('Helvetica')
    .text('Líder PESV', X + 4, r2Y + 17, { width: half - 8 })
    .text(ctx.cargo, X + half + 4, r2Y + 17, { width: half - 8 });
  doc.fontSize(7).font('Helvetica')
    .text(ctx.empresa, X + 4, r2Y + 29, { width: half - 8 })
    .text(ctx.empresa, X + half + 4, r2Y + 29, { width: half - 8 });

  const fY = r2Y + 50;
  doc.rect(X, fY, half, 20).fillAndStroke('#1A237E', '#333');
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text('FECHA:', X + 4, fY + 6);
  doc.rect(X + half, fY, half, 20).fillAndStroke('#1A237E', '#333');
  doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold').text('FECHA:', X + half + 4, fY + 6);
  doc.fillColor('#000');
  const f2Y = fY + 20;
  doc.rect(X, f2Y, half, 20).stroke('#CCC');
  doc.rect(X + half, f2Y, half, 20).stroke('#CCC');
  doc.fontSize(8).font('Helvetica')
    .text(ctx.fecha, X + 4, f2Y + 5, { width: half - 8 })
    .text(ctx.fecha, X + half + 4, f2Y + 5, { width: half - 8 });
}
