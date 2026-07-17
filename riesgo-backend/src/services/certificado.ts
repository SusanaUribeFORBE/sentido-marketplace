import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';
import { supabase } from '../supabase';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
const LOGO_RIESGO = path.join(ASSETS_DIR, 'logo-riesgo.png');
const LOGO_RIESGO_VIAL = path.join(ASSETS_DIR, 'logo-riesgovial.png');
const LOGO_AXA = path.join(ASSETS_DIR, 'logo-axa.png');
const LOGO_FORBE = path.join(ASSETS_DIR, 'logo-forbe.png');
const LOGO_ANDINA           = path.join(ASSETS_DIR, 'logo andina.png');
const LOGO_SUPERTRANSPORTE  = path.join(ASSETS_DIR, 'logo supertransporte.png');
const LOGO_SEC_EDUCACION    = path.join(ASSETS_DIR, 'logo secretaria de educacion.png');
const LOGO_AUTECO = path.join(ASSETS_DIR, 'logo-auteco.jpg');
const LOGO_ANSV = path.join(ASSETS_DIR, 'logo-ansv.png');
const LOGO_FIRMA_SUSANA  = path.join(ASSETS_DIR, 'firma-susana.jpg');
const LOGO_PROAVES       = path.join(ASSETS_DIR, 'logo-proaves.png');
const LOGO_FIRMA_CRISTINA = path.join(ASSETS_DIR, 'firma-cristina.png');

// Módulo de campaña B2C (no es capacitación SST): "pasaporte" en vez de certificado de aprobación
const MODULOS_AUTECO = new Set(['Reto del Motero Auteco']);

const LOGOS_MODULO: Record<string, string> = {
  'Seguridad Vial': LOGO_RIESGO_VIAL,
  'Riesgos Críticos Viales': LOGO_RIESGO_VIAL,
  'Antes de Arrancar': LOGO_RIESGO_VIAL,
  'Ruta Segura': LOGO_RIESGO_VIAL,
  'PAS Vial – Emergencias en Ruta': LOGO_RIESGO_VIAL,
  'Liderazgo Vial': LOGO_RIESGO_VIAL,
  'Reto del Motero Auteco': LOGO_RIESGO_VIAL,
  'Controladores Viales': LOGO_RIESGO_VIAL,
};

// Módulos que aún no cuentan con el aval de AXA Colpatria
const MODULOS_SIN_AVAL_AXA = new Set([
  'Riesgos Críticos Viales',
  'Antes de Arrancar',
  'Ruta Segura',
  'PAS Vial – Emergencias en Ruta',
  'Liderazgo Vial',
]);

// Módulos RiesGO! Vial con respaldo de contenido técnico de la Escuela Andina de Automovilismo.
// Son los módulos que alimentan el Pasaporte de Movilidad Segura (ver pasaporteMotero.ts),
// avalado por la Agencia Nacional de Seguridad Vial (ANSV) — no exclusivo de Auteco.
export const MODULOS_VIAL = new Set([
  'Seguridad Vial',
  'Riesgos Críticos Viales',
  'Antes de Arrancar',
  'Ruta Segura',
  'PAS Vial – Emergencias en Ruta',
  'Liderazgo Vial',
  'Reto del Motero Auteco',
  'Casco que Salva',
  'Velocidad y Supervivencia',
  'Moto en Buen Estado',
  'Moto y Trabajo',
]);

// Módulo independiente del Pasaporte: curso técnico de Controladores Viales avalado por
// la Escuela Andina de Automovilismo y FORBE SAS. Emite certificado propio, no pasaporte.
const MODULOS_ANDINA_FORBE = new Set([
  'Controladores Viales',
]);

// Módulo de inducción organizacional de la Fundación ProAves de Colombia.
// Firmas: Cristina Gómez (RRHH) + Susana Uribe (Responsable SG-SST ProAves).
const MODULOS_PROAVES = new Set([
  'Inducción ProAves',
]);

const LEGAL_ANDINA =
  'CEA Andina de Automovilismo SAS NIT 901905535-1, Centro de Enseñanza Automovilística ESCUELA ANDINA DE AUTOMOVILISMO ' +
  'con licencia de funcionamiento según Resolución 1672/2009 modificada por las Resoluciones 8939/2016 y 202550014007/2025. ' +
  'Registro de programas según Resolución 8686/2014 modificada por las Resoluciones 329/2016 y 201950037088/2019 ' +
  'de la Secretaría de Educación del Distrito de Medellín. ' +
  'Estamos bajo inspección y vigilancia de la Secretaría de Educación del Distrito de Medellín.';

const LICENCIA_FORBE =
  'FORBE SAS cuenta con Licencia N° 2022060086556 (23/07/2022) de la Secretaría Seccional de Salud y ' +
  'Protección Social de Antioquia para ofrecer servicios en Seguridad y Salud en el Trabajo a Nivel Nacional, ' +
  'acorde a los requisitos legales vigentes establecidos en Ley 1562 de 2012, Decreto 1072 de 2015, ' +
  'Resolución 0312 de 2019 y normatividad vigente en SST.';

const POLITICA_DATOS =
  'Los datos contenidos en este documento han sido tratados bajo la política de protección de datos ' +
  'personales de FORBE SAS en cumplimiento de la Ley 1581 de 2012, con el único fin de certificar las ' +
  'competencias del trabajador en el marco del SGSST.';

const INTENSIDAD_HORARIA: Record<string, number> = {
  'Orden y Aseo': 4,
  'Manejo de Cargas y Ergonomía': 4,
  'Trabajo en Alturas': 4,
  'Espacios Confinados': 4,
  'Salud Mental': 4,
  'Plan de Emergencias y Evacuación': 4,
  'Primeros Auxilios Básicos': 4,
  'Incendios y Sismos': 4,
  'Seguridad Vial': 2,
  'Riesgos Críticos Viales': 4,
  'Antes de Arrancar': 2,
  'Ruta Segura': 2,
  'PAS Vial – Emergencias en Ruta': 4,
  'Liderazgo Vial': 4,
  'Controladores Viales': 4,
  'Casco que Salva': 2,
  'Velocidad y Supervivencia': 2,
  'Moto en Buen Estado': 2,
  'Moto y Trabajo': 2,
};
const INTENSIDAD_HORARIA_DEFAULT = 2;

interface GenerarCertificadoParams {
  pinId: string;
  idEmpresa: string;
  cedulaUsuario: string;
  nombreUsuario: string;
  modulo: string;
  nombreEmpresa: string;
  emailSst: string | null;
}

export async function generarCertificado(params: GenerarCertificadoParams) {
  const codigoQr = `RGO-CERT-${params.pinId.slice(0, 8).toUpperCase()}`;
  const verificationUrl = `${BASE_URL}/api/verificar/${codigoQr}`;

  const qrBuffer = await QRCode.toBuffer(verificationUrl, { width: 200 });
  const pdfBuffer = await buildPdf(params, codigoQr, qrBuffer, verificationUrl);

  const filePath = `${codigoQr}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('certificados')
    .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('certificados').getPublicUrl(filePath);
  const urlPdf = urlData.publicUrl;

  const { data: cert, error: insertError } = await supabase
    .from('certificados')
    .insert({
      pin_id: params.pinId,
      id_empresa: params.idEmpresa,
      cedula_usuario: params.cedulaUsuario,
      nombre_usuario: params.nombreUsuario,
      modulo: params.modulo,
      codigo_qr: codigoQr,
      url_pdf: urlPdf,
      enviado_a: params.emailSst || '',
    })
    .select()
    .single();

  if (insertError) throw insertError;

  if (resend && params.emailSst) {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'RiesGO <onboarding@resend.dev>',
      to: params.emailSst,
      subject: `Certificado RiesGO! - ${params.nombreUsuario} (${params.modulo})`,
      html: buildEmailHtml(params, urlPdf, verificationUrl),
      attachments: [{ filename: `${codigoQr}.pdf`, content: pdfBuffer.toString('base64') }],
    });
  }

  return cert;
}

function buildPdf(
  data: GenerarCertificadoParams,
  codigoQr: string,
  qrBuffer: Buffer,
  verificationUrl: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const NAVY = '#0B1F3A';
    const YELLOW = '#FFC727';
    const GRAY = '#5C554A';

    const W = doc.page.width;
    const H = doc.page.height;

    // Bordes decorativos
    doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(NAVY);
    doc.rect(28, 28, W - 56, H - 56).lineWidth(1).stroke(YELLOW);

    // Encabezado: logo RiesGO! (o variante del módulo) a la izquierda, AXA Colpatria a la derecha
    const logoModulo = LOGOS_MODULO[data.modulo] || LOGO_RIESGO;
    if (fs.existsSync(logoModulo)) {
      doc.image(logoModulo, 45, 35, { height: 50 });
    } else {
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text('RiesGO!', 45, 50);
    }

    const esAuteco      = MODULOS_AUTECO.has(data.modulo);
    const esPasaporte   = MODULOS_VIAL.has(data.modulo);
    const esAndinaForbe = MODULOS_ANDINA_FORBE.has(data.modulo);
    const esProAves     = MODULOS_PROAVES.has(data.modulo);
    const avaladoPorAxa = !esPasaporte && !esAndinaForbe && !esProAves && !MODULOS_SIN_AVAL_AXA.has(data.modulo);

    const logoDerecha      = esProAves ? LOGO_PROAVES  : esPasaporte ? LOGO_ANSV : esAndinaForbe ? LOGO_FORBE : avaladoPorAxa ? LOGO_AXA : LOGO_FORBE;
    const textoLogoDerecha = esProAves ? 'ProAves' : esPasaporte ? 'ANSV' : esAndinaForbe ? 'FORBE SAS' : avaladoPorAxa ? 'AXA COLPATRIA' : 'FORBE SAS';

    if (fs.existsSync(logoDerecha)) {
      const logoDerechaOpts = esProAves ? { fit: [90, 75] as [number,number] } : { fit: [120, 50] as [number,number] };
      const logoDerechaX    = esProAves ? W - 135 : W - 165;
      const logoDerechaY    = esProAves ? 18 : 35;
      doc.image(logoDerecha, logoDerechaX, logoDerechaY, logoDerechaOpts);
    } else {
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(textoLogoDerecha, W - 165, 55, {
        width: 120,
        align: 'right',
      });
    }

    const mostrarAndina = esPasaporte || esAndinaForbe;
    if (mostrarAndina && fs.existsSync(LOGO_ANDINA)) {
      doc.image(LOGO_ANDINA, W / 2 - 55, 38, { fit: [110, 42] });
    }
    // ProAves: logo izquierdo genérico de RiesGO (ya cargado arriba), logo derecho ProAves
    // No usa logo Andina en el centro — es un módulo independiente.

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(9)
      .text(
        esAuteco
          ? 'Reto de movilidad segura para motociclistas'
          : esPasaporte
            ? 'Pasaporte de movilidad segura · Aval Agencia Nacional de Seguridad Vial (ANSV)'
            : esAndinaForbe
              ? 'Curso técnico de Controladores Viales · Aval Escuela Andina de Automovilismo y FORBE SAS'
              : esProAves
                ? 'Inducción Organizacional · Fundación ProAves de Colombia'
                : 'Programa de gamificación en Seguridad y Salud en el Trabajo (SST)',
        0,
        90,
        { align: 'center' }
      );

    // Título
    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(esPasaporte ? 'PASAPORTE DE MOVILIDAD SEGURA' : 'CERTIFICADO DE APROBACIÓN', 0, 108, { align: 'center' });

    // Línea decorativa
    doc
      .moveTo(W / 2 - 100, 148)
      .lineTo(W / 2 + 100, 148)
      .lineWidth(2)
      .stroke(YELLOW);

    // Cuerpo
    doc.fillColor(GRAY).font('Helvetica').fontSize(12).text('Se certifica que', 0, 168, { align: 'center' });

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(data.nombreUsuario.toUpperCase(), 0, 188, { align: 'center' });

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(11)
      .text(`identificado(a) con cédula de ciudadanía No. ${data.cedulaUsuario}`, 0, 222, { align: 'center' });

    doc
      .fontSize(12)
      .text(esAuteco ? 'completó satisfactoriamente' : 'aprobó satisfactoriamente el módulo', 0, 245, {
        align: 'center',
      });

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text(data.modulo, 0, 265, { align: 'center' });

    const horas = INTENSIDAD_HORARIA[data.modulo] ?? INTENSIDAD_HORARIA_DEFAULT;
    const lineaFecha = esAuteco
      ? `Aliado: ${data.nombreEmpresa}    |    Fecha: ${new Date().toLocaleDateString('es-CO')}`
      : `Empresa: ${data.nombreEmpresa}    |    Fecha: ${new Date().toLocaleDateString('es-CO')}    |    Intensidad horaria: ${horas} horas`;

    doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(lineaFecha, 0, 298, { align: 'center' });

    // Pie: QR a la izquierda, firma a la derecha
    const footerY = 340;

    doc.image(qrBuffer, 70, footerY, { fit: [75, 75] });
    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(7)
      .text(`Código: ${codigoQr}`, 50, footerY + 80, { width: 115, align: 'center' });
    doc
      .fontSize(8)
      .text('Escanea para verificar', 50, footerY + 92, { width: 115, align: 'center', link: verificationUrl });

    if (esProAves) {
      // ── DOS BLOQUES: Cristina RRHH (izquierda) + Susana SG-SST (derecha) ──
      const bW   = 200;
      const b1X  = Math.round(W / 2) - bW - 15;
      const b2X  = Math.round(W / 2) + 15;
      const lineY = footerY + 45;

      // Bloque 1 — María Cristina Gómez Ossa: imagen de firma + marca de agua
      if (fs.existsSync(LOGO_FIRMA_CRISTINA)) {
        doc.image(LOGO_FIRMA_CRISTINA, b1X + 10, footerY + 8, { fit: [180, 36] });
      }
      doc.save();
      doc.rotate(-22, { origin: [b1X + 100, footerY + 24] });
      doc.fillColor('#c5d3e0').font('Helvetica-Bold').fontSize(8)
         .text('ProAves', b1X + 60, footerY + 20, { lineBreak: false, characterSpacing: 2 });
      doc.restore();
      doc.moveTo(b1X, lineY).lineTo(b1X + bW, lineY).lineWidth(1).stroke(NAVY);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
         .text('María Cristina Gómez Ossa', b1X, lineY + 6, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Coordinadora de Recursos Humanos', b1X, lineY + 18, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
         .text('Fundación ProAves de Colombia', b1X, lineY + 29, { width: bW, align: 'center' });

      // Bloque 2 — María Susana Uribe Galeano: imagen de firma + marca de agua
      if (fs.existsSync(LOGO_FIRMA_SUSANA)) {
        doc.image(LOGO_FIRMA_SUSANA, b2X + 50, footerY + 8, { fit: [100, 32] });
      }
      doc.save();
      doc.rotate(-22, { origin: [b2X + 100, footerY + 24] });
      doc.fillColor('#c5d3e0').font('Helvetica-Bold').fontSize(8)
         .text('FORBE SAS', b2X + 58, footerY + 20, { lineBreak: false, characterSpacing: 2 });
      doc.restore();
      doc.moveTo(b2X, lineY).lineTo(b2X + bW, lineY).lineWidth(1).stroke(NAVY);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
         .text('María Susana Uribe Galeano', b2X, lineY + 6, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Responsable del SG-SST', b2X, lineY + 18, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
         .text('Fundación ProAves de Colombia', b2X, lineY + 29, { width: bW, align: 'center' });

    } else if (esAndinaForbe) {
      // ── DOS BLOQUES: Andina (izquierda) + FORBE SAS (derecha) ──
      const bW   = 200;
      const b1X  = Math.round(W / 2) - bW - 15;
      const b2X  = Math.round(W / 2) + 15;
      const lineY = footerY + 45;

      // Bloque 1 — Andina: iniciales estilizadas
      doc.fillColor(NAVY).font('Helvetica-Oblique').fontSize(26)
         .text('L.D.P.J.', b1X, footerY + 10, { width: bW, align: 'center', lineBreak: false });
      doc.moveTo(b1X, lineY).lineTo(b1X + bW, lineY).lineWidth(1).stroke(NAVY);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
         .text('Luz Dary Páeres Jaramillo', b1X, lineY + 6, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Representante Legal', b1X, lineY + 18, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
         .text('Escuela Andina de Automovilismo', b1X, lineY + 29, { width: bW, align: 'center' });

      // Bloque 2 — FORBE SAS: imagen de firma + marca de agua
      if (fs.existsSync(LOGO_FIRMA_SUSANA)) {
        doc.image(LOGO_FIRMA_SUSANA, b2X + 50, footerY + 8, { fit: [100, 32] });
      }
      doc.save();
      doc.rotate(-22, { origin: [b2X + 100, footerY + 24] });
      doc.fillColor('#c5d3e0').font('Helvetica-Bold').fontSize(8)
         .text('FORBE SAS', b2X + 58, footerY + 20, { lineBreak: false, characterSpacing: 2 });
      doc.restore();
      doc.moveTo(b2X, lineY).lineTo(b2X + bW, lineY).lineWidth(1).stroke(NAVY);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
         .text('María Susana Uribe Galeano', b2X, lineY + 6, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Gerente', b2X, lineY + 18, { width: bW, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
         .text('FORBE SAS', b2X, lineY + 29, { width: bW, align: 'center' });

    } else {
      // ── UN BLOQUE (resto de módulos) ──────────────────────────
      const sigX  = W - 280;
      const lineY = footerY + 45;

      if (fs.existsSync(LOGO_FIRMA_SUSANA)) {
        doc.image(LOGO_FIRMA_SUSANA, sigX + 50, footerY + 8, { fit: [100, 32] });
      }
      doc.save();
      doc.rotate(-22, { origin: [sigX + 100, footerY + 24] });
      doc.fillColor('#c5d3e0').font('Helvetica-Bold').fontSize(8)
         .text('FORBE SAS', sigX + 58, footerY + 20, { lineBreak: false, characterSpacing: 2 });
      doc.restore();
      doc.moveTo(sigX, lineY).lineTo(sigX + 200, lineY).lineWidth(1).stroke(NAVY);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
         .text('María Susana Uribe Galeano', sigX, lineY + 6, { width: 200, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text('Gerente', sigX, lineY + 18, { width: 200, align: 'center' });
      doc.fillColor(GRAY).font('Helvetica').fontSize(8.5)
         .text(
           esAuteco    ? 'Aval ANSV · Aliado: Auteco'
           : esPasaporte ? 'Aprobado por la Agencia Nacional de Seguridad Vial (ANSV)'
           : avaladoPorAxa ? 'Coordinador SST - Programa AXA Colpatria'
           : 'FORBE SAS',
           sigX, lineY + 29, { width: 200, align: 'center' }
         );
    }

    // Pie legal
    doc
      .moveTo(40, footerY + 100)
      .lineTo(W - 40, footerY + 100)
      .lineWidth(0.5)
      .stroke('#CCCCCC');

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(6.5)
      .text(LICENCIA_FORBE, 40, footerY + 108, { width: W - 80, align: 'justify' });

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(6)
      .text(POLITICA_DATOS, 40, footerY + 130, { width: W - 80, align: 'justify' });

    if (mostrarAndina) {
      doc
        .fillColor(GRAY)
        .font('Helvetica')
        .fontSize(5.5)
        .text(LEGAL_ANDINA, 40, doc.y + 4, { width: W - 80, align: 'justify' });
    }

    // Logos institucionales debajo del texto legal (solo Controladores Viales)
    if (esAndinaForbe) {
      const logoY = doc.y + 6;
      if (fs.existsSync(LOGO_SUPERTRANSPORTE)) {
        doc.image(LOGO_SUPERTRANSPORTE, 40, logoY, { fit: [120, 24] });
      }
    }

    doc.end();
  });
}

function buildEmailHtml(data: GenerarCertificadoParams, urlPdf: string, verificationUrl: string) {
  return `
    <h2>Nuevo certificado RiesGO!</h2>
    <p><strong>${data.nombreUsuario}</strong> (cédula ${data.cedulaUsuario}) aprobó el módulo
    <strong>${data.modulo}</strong> en <strong>${data.nombreEmpresa}</strong>.</p>
    <p>Certificado adjunto en PDF, también disponible en:
    <a href="${urlPdf}">${urlPdf}</a></p>
    <p>Verificación: <a href="${verificationUrl}">${verificationUrl}</a></p>
  `;
}
