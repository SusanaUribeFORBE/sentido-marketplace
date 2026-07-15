import PDFDocument from 'pdfkit';

interface EmpData {
  nombre: string;
  cc: string;
  tipo_doc?: string;
  cargo?: string;
  sexo?: string;
}

interface ExamenData {
  fecha?: string;
  tipo?: string;
  ips?: string;
  medico?: string;
  concepto_aptitud?: string;
  examenes_realizados?: string[];
  recomendaciones?: string[];
  restricciones?: string[];
}

export interface CartaParams {
  empresa: string;
  prefijoDocs: string;
  vigenciaDesde?: string | null;
  emp: EmpData;
  examen: ExamenData;
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fechaLarga(f?: string): string {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${parseInt(d, 10)} de ${MESES[+m - 1]} de ${y}`;
}

function fechaCorta(f?: string | null): string {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function tipoLabel(tipo?: string): string {
  const MAP: Record<string, string> = {
    'PRE-INGRESO': 'preocupacional', 'PERIODICO': 'periódico',
    'RETIRO': 'de retiro', 'POST-INCAPACIDAD': 'post-incapacidad',
  };
  return MAP[tipo || ''] || (tipo || '').toLowerCase();
}

const SVE_KW: Record<string, string[]> = {
  'AUDIOMETRÍA':        ['audio'],
  'ESPIROMETRÍA':       ['espiro', 'pulmon', 'respirat'],
  'VISOMETRÍA':         ['viso', 'visual', 'visión', 'vision', 'optomet', 'lente', 'refract'],
  'OSTEOMUSCULAR':      ['osteo', 'musculo', 'muscul', 'articular', 'osteomuscul'],
  'EXAMEN MÉDICO':      ['médico', 'medico', 'físico', 'fisico', 'general', 'clínico'],
  'LABORATORIO':        ['laborat', 'hemato', 'sangre', 'glucos'],
  'ELECTROCARDIOGRAMA': ['electro', 'cardio', 'ecg'],
  'RADIOGRAFÍA':        ['radio', 'rayos', 'torax', 'tórax'],
};

function matchRec(sve: string, recs: string[]): string[] {
  const kws = Object.entries(SVE_KW).find(([k]) => k === sve.toUpperCase())?.[1] || [];
  return recs.filter(r => kws.some(kw => r.toLowerCase().includes(kw)));
}

export function mergeExamenesMismaFecha(examenes: any[]): any {
  if (!examenes || !examenes.length) return null;
  const byDate: Record<string, any[]> = {};
  for (const ex of examenes) {
    const f = ex.fecha || 'sin-fecha';
    (byDate[f] = byDate[f] || []).push(ex);
  }
  const fecha = Object.keys(byDate).sort().reverse()[0];
  const grupo = byDate[fecha];
  if (grupo.length === 1) return grupo[0];
  const prio: Record<string, number> = { 'NO APTO': 3, 'APTO CON RESTRICCIONES': 2, 'APTO SIN RESTRICCIONES': 1 };
  const principal = grupo.find((ex: any) => ex.medico || ex.ips) || grupo[0];
  const conceptoFinal = grupo.reduce((best: string, ex: any) =>
    (prio[ex.concepto_aptitud] ?? 0) > (prio[best] ?? 0) ? ex.concepto_aptitud : best,
    principal.concepto_aptitud);
  return {
    ...principal,
    examenes_realizados: [...new Set(grupo.flatMap((ex: any) => ex.examenes_realizados || []))],
    recomendaciones:     [...new Set(grupo.flatMap((ex: any) => ex.recomendaciones     || []))],
    restricciones:       [...new Set(grupo.flatMap((ex: any) => ex.restricciones       || []))],
    concepto_aptitud: conceptoFinal,
    ips:    [...new Set(grupo.map((ex: any) => ex.ips).filter(Boolean))].join(' / '),
    medico: [...new Set(grupo.map((ex: any) => ex.medico).filter(Boolean))].join(' / '),
  };
}

export function generarCartaPDF(params: CartaParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { empresa, prefijoDocs, vigenciaDesde, emp, examen } = params;
    const recs  = examen.recomendaciones || [];
    const rests = examen.restricciones   || [];
    const sves  = examen.examenes_realizados || [];

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W  = doc.page.width;   // 595.28pt
    const ML = 56.69;            // 2 cm
    const MT = 51.02;            // 1.8 cm
    const CW = W - 2 * ML;

    // ─── Helpers ────────────────────────────────────────────

    function cell(x: number, y: number, w: number, h: number, bg?: string) {
      if (bg) { doc.fillColor(bg).rect(x, y, w, h).fill(); }
      doc.strokeColor('#000000').lineWidth(1.5).rect(x, y, w, h).stroke();
    }

    function vline(x: number, y: number, h: number) {
      doc.strokeColor('#000000').lineWidth(1.5).moveTo(x, y).lineTo(x, y + h).stroke();
    }

    function hline(x: number, y: number, w: number, lw = 1) {
      doc.strokeColor('#000000').lineWidth(lw).moveTo(x, y).lineTo(x + w, y).stroke();
    }

    function drawHeaderTable(y0: number): number {
      const TH = 46;
      const c1 = CW * 0.22, c2 = CW * 0.50, c3 = CW * 0.28;

      cell(ML,          y0, CW, TH);
      vline(ML + c1,    y0, TH);
      vline(ML + c1 + c2, y0, TH);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
         .text(empresa.toUpperCase(), ML + 3, y0 + 6, { width: c1 - 6, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(8)
         .text('CARTA\nRECOMENDACIONES\nMÉDICAS LABORALES Y\nCOMPROMISO DE CUMPLIMIENTO',
               ML + c1 + 3, y0 + 2, { width: c2 - 6, align: 'center', lineGap: 0.5 });

      doc.font('Helvetica').fontSize(7.5)
         .text(`CÓDIGO: ${prefijoDocs} F005\nVERSIÓN 1\nFECHA DE VIGENCIA: ${fechaCorta(vigenciaDesde)}`,
               ML + c1 + c2 + 4, y0 + 7, { width: c3 - 8, lineGap: 1.5 });

      return y0 + TH;
    }

    function drawSVETable(y0: number): number {
      const c1 = CW * 0.22, c2 = CW * 0.36, c3 = CW * 0.13, c4 = CW * 0.29;
      const HH = 14, SH = 12;

      // Main header
      cell(ML, y0, CW, HH, '#f0f0f0');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
         .text('CONCEPTO MÉDICO DE APTITUD LABORAL', ML, y0 + 3, { width: CW, align: 'center' });
      y0 += HH;

      // Sub-header
      cell(ML, y0, CW, SH, '#f8f8f8');
      vline(ML + c1, y0, SH); vline(ML + c1 + c2, y0, SH); vline(ML + c1 + c2 + c3, y0, SH);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
      doc.text('S.V.E',                           ML,                  y0 + 2, { width: c1, align: 'center' });
      doc.text('Recomendaciones',                 ML + c1,             y0 + 2, { width: c2, align: 'center' });
      doc.text('Restricciones',                   ML + c1 + c2,        y0 + 2, { width: c3, align: 'center' });
      doc.text('Interpretación del resultado',    ML + c1 + c2 + c3,   y0 + 2, { width: c4, align: 'center' });
      y0 += SH;

      // Rows
      const svesToDraw = sves.length ? sves : ['EXAMEN MÉDICO'];
      const used = new Set<string>();
      for (const sve of svesToDraw) {
        const matched = matchRec(sve, recs).filter(r => !used.has(r));
        matched.forEach(r => used.add(r));
        const recTxt = matched.length
          ? matched.map(r => `• ${r}`).join('\n')
          : 'Control periódico teniendo en cuenta hallazgos del examen.';

        doc.font('Helvetica').fontSize(7.5);
        const recH  = doc.heightOfString(recTxt, { width: c2 - 6 });
        const RH    = Math.max(24, recH + 10);

        cell(ML, y0, CW, RH);
        vline(ML + c1, y0, RH); vline(ML + c1 + c2, y0, RH); vline(ML + c1 + c2 + c3, y0, RH);

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
           .text(sve.toUpperCase(), ML + 3, y0 + 4, { width: c1 - 6 });
        doc.font('Helvetica').fontSize(7.5)
           .text(recTxt, ML + c1 + 3, y0 + 4, { width: c2 - 6 });
        doc.text('Ninguna', ML + c1 + c2 + 2, y0 + 4, { width: c3 - 4, align: 'center' });
        doc.font('Helvetica').fontSize(7)
           .text('Resultado normal y adecuado para el cargo.', ML + c1 + c2 + c3 + 3, y0 + 4, { width: c4 - 6 });
        y0 += RH;
      }

      return y0;
    }

    function pageNum(n: number) {
      doc.font('Helvetica').fontSize(7.5).fillColor('#555555')
         .text(`Página ${n} de 2`, ML, doc.page.height - MT + 4, { width: CW, align: 'right' });
    }

    // ─── Página 1 ────────────────────────────────────────────

    let y = MT;
    y = drawHeaderTable(y) + 12;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000')
       .text(`Medellín, ${fechaLarga(examen.fecha)}`, ML, y);
    y += 18;

    doc.font('Helvetica').fontSize(10)
       .text(emp.sexo === 'FEMENINO' ? 'Señora' : 'Señor', ML, y);
    y += 13;
    doc.font('Helvetica-Bold').fontSize(10).text(emp.nombre, ML, y);
    y += 13;
    doc.font('Helvetica').fontSize(10)
       .text(`ASUNTO: Concepto Médico Examen médico ${tipoLabel(examen.tipo)}`, ML, y);
    y += 18;

    doc.font('Helvetica').fontSize(10).text('Cordial Saludo,', ML, y);
    y += 18;

    const ipsMedico = examen.medico ? `, médico ${examen.medico}` : '';
    const p1 = `Teniendo como referencia el concepto médico emitido el ${fechaLarga(examen.fecha)} por la IPS ${examen.ips || '______________________________'}${ipsMedico}, se debe tener en cuenta lo siguiente:`;
    doc.font('Helvetica').fontSize(10).text(p1, ML, y, { width: CW });
    y += doc.heightOfString(p1, { width: CW }) + 14;

    doc.font('Helvetica-Bold').fontSize(10).text('CONCEPTO DE APTITUD:', ML, y);
    y += 16;

    const tipoDoc  = (emp.tipo_doc || 'CC').toUpperCase();
    const concepto = (examen.concepto_aptitud || 'APTO').toUpperCase();
    const cargo    = (emp.cargo || '__________').toUpperCase();
    const p2 = `De acuerdo al examen médico ocupacional realizado a ${emp.nombre.toUpperCase()} con documento de identificación ${tipoDoc} ${emp.cc} se considera que es ${concepto} para el Cargo de ${cargo}. A continuación, se presentan las recomendaciones:`;
    doc.font('Helvetica').fontSize(10).text(p2, ML, y, { width: CW });
    y += doc.heightOfString(p2, { width: CW }) + 14;

    y = drawSVETable(y) + 12;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('RESTRICCIONES:', ML, y);
    y += 14;
    if (rests.length) {
      for (const r of rests) {
        doc.font('Helvetica').fontSize(10).text(`• ${r}`, ML + 12, y, { width: CW - 12 });
        y += doc.heightOfString(`• ${r}`, { width: CW - 12 }) + 4;
      }
    } else {
      doc.font('Helvetica').fontSize(10).text('N/A', ML + 12, y);
    }

    pageNum(1);

    // ─── Página 2 ────────────────────────────────────────────

    doc.addPage();
    y = MT;
    y = drawHeaderTable(y) + 16;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('REMISIONES:', ML, y);
    y += 16;

    const used2 = new Set<string>();
    sves.forEach(s => matchRec(s, recs).forEach(r => used2.add(r)));
    const remisiones = recs.filter(r => !used2.has(r));

    if (remisiones.length) {
      for (const r of remisiones) {
        doc.font('Helvetica').fontSize(10).text(r, ML, y, { width: CW });
        y += doc.heightOfString(r, { width: CW }) + 6;
      }
    } else {
      doc.font('Helvetica').fontSize(10).fillColor('#555555').text('Sin remisiones adicionales.', ML, y);
      y += 16;
    }
    y += 10;
    doc.fillColor('#000000');

    const pCierre = `${empresa.toUpperCase()}, le informa que, como parte del cumplimiento del Sistema de Gestión de Seguridad y Salud en el Trabajo, el responsable de Seguridad y Salud en el trabajo, hará un seguimiento periódico al cumplimiento de las anteriores recomendaciones y en caso de manifestación de remisiones médicas, se le solicitarán las debidas constancias médicas de la remisión a la cual es enviado.`;
    doc.font('Helvetica').fontSize(10).text(pCierre, ML, y, { width: CW });
    y += doc.heightOfString(pCierre, { width: CW }) + 14;

    const pNota = 'Nota: debe realizarse los debidos procesos médicos en los 30 días siguientes a partir de la fecha de entrega de este documento y en caso de ser diagnosticada alguna patología la cual requiera un trato especial, por favor notificar al jefe inmediato.';
    doc.font('Helvetica').fontSize(10).text(pNota, ML, y, { width: CW });
    y += doc.heightOfString(pNota, { width: CW }) + 32;

    // Firmas (2 columnas)
    const fCW = (CW - 32) / 2;
    const fX2 = ML + fCW + 32;

    // Columna izquierda
    hline(ML, y + 28, fCW);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000').text('FIRMA:', ML, y + 32);
    hline(ML, y + 62, fCW);
    doc.font('Helvetica-Bold').fontSize(8)
       .text('NOMBRE COMPLETO DEL EMPLEADO\nQUE ENTREGA LAS RECOMENDACIONES:', ML, y + 66, { width: fCW });
    hline(ML, y + 100, fCW);
    doc.font('Helvetica-Bold').fontSize(8).text('CARGO:', ML, y + 104);

    // Columna derecha
    hline(fX2, y + 28, fCW);
    doc.font('Helvetica-Bold').fontSize(8).text('FIRMA DEL EMPLEADO', fX2, y + 32, { width: fCW });
    hline(fX2, y + 62, fCW);
    doc.font('Helvetica-Bold').fontSize(8).text('NOMBRE COMPLETO DEL EMPLEADO:', fX2, y + 66, { width: fCW });
    hline(fX2, y + 100, fCW);
    doc.font('Helvetica-Bold').fontSize(8).text(`${tipoDoc}:`, fX2, y + 104, { width: fCW });

    pageNum(2);

    doc.end();
  });
}
