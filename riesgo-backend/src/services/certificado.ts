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
const LOGO_AXA = path.join(ASSETS_DIR, 'logo-axa.png');

const LICENCIA_FORBE =
  'FORBE SAS cuenta con Licencia N° 2022060086556 (23/07/2022) de la Secretaría Seccional de Salud y ' +
  'Protección Social de Antioquia para ofrecer servicios en Seguridad y Salud en el Trabajo a Nivel Nacional, ' +
  'acorde a los requisitos legales vigentes establecidos en Ley 1562 de 2012, Decreto 1072 de 2015, ' +
  'Resolución 0312 de 2019 y normatividad vigente en SST.';

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

    // Encabezado: logo RiesGO! a la izquierda, AXA Colpatria a la derecha
    if (fs.existsSync(LOGO_RIESGO)) {
      doc.image(LOGO_RIESGO, 45, 35, { height: 50 });
    } else {
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text('RiesGO!', 45, 50);
    }

    if (fs.existsSync(LOGO_AXA)) {
      doc.image(LOGO_AXA, W - 165, 35, { fit: [120, 50] });
    } else {
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('AXA COLPATRIA', W - 165, 55, {
        width: 120,
        align: 'right',
      });
    }

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(9)
      .text('Programa de gamificación en Seguridad y Salud en el Trabajo (SST)', 0, 90, { align: 'center' });

    // Título
    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text('CERTIFICADO DE APROBACIÓN', 0, 108, { align: 'center' });

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

    doc.fontSize(12).text('aprobó satisfactoriamente el módulo', 0, 245, { align: 'center' });

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text(data.modulo, 0, 265, { align: 'center' });

    doc
      .fillColor(GRAY)
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Empresa: ${data.nombreEmpresa}    |    Fecha: ${new Date().toLocaleDateString('es-CO')}`,
        0,
        298,
        { align: 'center' }
      );

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

    const sigX = W - 280;
    doc
      .moveTo(sigX, footerY + 45)
      .lineTo(sigX + 200, footerY + 45)
      .lineWidth(1)
      .stroke(NAVY);
    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('RiesGO!', sigX, footerY + 50, { width: 200, align: 'center' })
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GRAY)
      .text('Coordinador SST - Programa AXA Colpatria', sigX, footerY + 65, { width: 200, align: 'center' });

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
