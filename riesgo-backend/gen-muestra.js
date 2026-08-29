const path = require('path');
const fs   = require('fs');
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

const ASSETS_DIR           = path.join(__dirname, 'assets');
const LOGO_RIESGO          = path.join(ASSETS_DIR, 'logo-riesgo.png');
const LOGO_RIESGO_VIAL     = path.join(ASSETS_DIR, 'logo-riesgovial.png');
const LOGO_FORBE           = path.join(ASSETS_DIR, 'logo-forbe.png');
const LOGO_ANDINA          = path.join(ASSETS_DIR, 'logo andina.png');
const LOGO_ANSV            = path.join(ASSETS_DIR, 'logo-ansv.png');
const LOGO_FIRMA_SUSANA    = path.join(ASSETS_DIR, 'firma-susana.jpg');
const LOGO_PROAVES         = path.join(ASSETS_DIR, 'logo-proaves.png');
const LOGO_FIRMA_CRISTINA  = path.join(ASSETS_DIR, 'firma-cristina.png');

const LICENCIA_FORBE = 'FORBE SAS cuenta con Licencia N° 2022060086556 (23/07/2022) de la Secretaría Seccional de Salud y Protección Social de Antioquia para ofrecer servicios en Seguridad y Salud en el Trabajo a Nivel Nacional, acorde a los requisitos legales vigentes establecidos en Ley 1562 de 2012, Decreto 1072 de 2015, Resolución 0312 de 2019 y normatividad vigente en SST.';
const POLITICA_DATOS = 'Los datos contenidos en este documento han sido tratados bajo la política de protección de datos personales de FORBE SAS en cumplimiento de la Ley 1581 de 2012, con el único fin de certificar las competencias del trabajador en el marco del SGSST.';
const LEGAL_ANDINA = 'CEA Andina de Automovilismo SAS NIT 901905535-1, Centro de Enseñanza Automovilística ESCUELA ANDINA DE AUTOMOVILISMO con licencia de funcionamiento según Resolución 1672/2009 modificada por las Resoluciones 8939/2016 y 202550014007/2025. Registro de programas según Resolución 8686/2014 modificada por las Resoluciones 329/2016 y 201950037088/2019 de la Secretaría de Educación del Distrito de Medellín. Estamos bajo inspección y vigilancia de la Secretaría de Educación del Distrito de Medellín.';

async function generarPasaporteANSV() {
  const qrBuffer = await QRCode.toBuffer(
    'https://riesgo-backend-production.up.railway.app/api/verificar/MUESTRA-ANSV',
    { width: 200 }
  );

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const outPath = path.join(__dirname, 'certificado-muestra-ansv.pdf');
  const out = fs.createWriteStream(outPath);
  doc.pipe(out);

  const NAVY   = '#0B1F3A';
  const YELLOW = '#FFC727';
  const GRAY   = '#5C554A';
  const W = doc.page.width;
  const H = doc.page.height;

  doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(NAVY);
  doc.rect(28, 28, W - 56, H - 56).lineWidth(1).stroke(YELLOW);

  // Logo izquierdo: RiesGO! Vial
  if (fs.existsSync(LOGO_RIESGO_VIAL)) doc.image(LOGO_RIESGO_VIAL, 45, 35, { height: 50 });

  // Logo derecho: ANSV
  if (fs.existsSync(LOGO_ANSV)) doc.image(LOGO_ANSV, W - 165, 32, { fit: [120, 50] });

  // Logo centro: Escuela Andina
  if (fs.existsSync(LOGO_ANDINA)) doc.image(LOGO_ANDINA, W / 2 - 55, 38, { fit: [110, 42] });

  // Subtítulo
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
    .text('Pasaporte de movilidad segura · Aval Agencia Nacional de Seguridad Vial (ANSV)', 0, 90, { align: 'center' });

  // Título
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28)
    .text('PASAPORTE DE MOVILIDAD SEGURA', 0, 108, { align: 'center' });

  doc.moveTo(W / 2 - 100, 148).lineTo(W / 2 + 100, 148).lineWidth(2).stroke(YELLOW);

  doc.fillColor(GRAY).font('Helvetica').fontSize(12).text('Se certifica que', 0, 168, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(24).text('JUAN PÉREZ GÓMEZ', 0, 188, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(11)
    .text('identificado(a) con cédula de ciudadanía No. 1037612345', 0, 222, { align: 'center' });
  doc.fontSize(12).text('aprobó satisfactoriamente el módulo', 0, 245, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text('Seguridad Vial', 0, 265, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(
    'Empresa: DEMO ANSV    |    Fecha: ' + new Date().toLocaleDateString('es-CO') + '    |    Intensidad horaria: 2 horas',
    0, 298, { align: 'center' });

  // Pie: QR a la izquierda, firma a la derecha
  const footerY = 340;
  doc.image(qrBuffer, 70, footerY, { fit: [75, 75] });
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
    .text('Código: MUESTRA-ANSV', 50, footerY + 80, { width: 115, align: 'center' });
  doc.fontSize(8).text('Escanea para verificar', 50, footerY + 92, { width: 115, align: 'center' });

  // Firma — un bloque, Susana Uribe / ANSV
  const sigX  = W - 280;
  const lineY = footerY + 45;

  if (fs.existsSync(LOGO_FIRMA_SUSANA)) doc.image(LOGO_FIRMA_SUSANA, sigX + 50, footerY + 8, { fit: [100, 32] });
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
     .text('Aprobado por la Agencia Nacional de Seguridad Vial (ANSV)', sigX, lineY + 29, { width: 200, align: 'center' });

  // Pie legal
  doc.moveTo(40, footerY + 100).lineTo(W - 40, footerY + 100).lineWidth(0.5).stroke('#CCCCCC');
  doc.fillColor(GRAY).font('Helvetica').fontSize(6.5)
    .text(LICENCIA_FORBE, 40, footerY + 108, { width: W - 80, align: 'justify' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(6)
    .text(POLITICA_DATOS, 40, footerY + 130, { width: W - 80, align: 'justify' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(5.5)
    .text(LEGAL_ANDINA, 40, doc.y + 4, { width: W - 80, align: 'justify' });

  doc.end();
  await new Promise(r => out.on('finish', r));
  console.log('Listo:', outPath);
}

async function generarProAves() {
  const qrBuffer = await QRCode.toBuffer(
    'https://riesgo-backend-production.up.railway.app/api/verificar/MUESTRA-01',
    { width: 200 }
  );

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const outPath = path.join(__dirname, 'certificado-muestra8.pdf');
  const out = fs.createWriteStream(outPath);
  doc.pipe(out);

  const NAVY   = '#0B1F3A';
  const YELLOW = '#FFC727';
  const GRAY   = '#5C554A';
  const W = doc.page.width;

  doc.rect(20, 20, W - 40, doc.page.height - 40).lineWidth(3).stroke(NAVY);
  doc.rect(28, 28, W - 56, doc.page.height - 56).lineWidth(1).stroke(YELLOW);

  if (fs.existsSync(LOGO_RIESGO)) doc.image(LOGO_RIESGO, 45, 35, { height: 50 });
  if (fs.existsSync(LOGO_PROAVES)) doc.image(LOGO_PROAVES, W - 135, 18, { fit: [90, 75] });

  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(
    'Inducción Organizacional · Fundación ProAves de Colombia',
    0, 90, { align: 'center' });

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28)
    .text('CERTIFICADO DE APROBACIÓN', 0, 108, { align: 'center' });

  doc.moveTo(W / 2 - 100, 148).lineTo(W / 2 + 100, 148).lineWidth(2).stroke(YELLOW);

  doc.fillColor(GRAY).font('Helvetica').fontSize(12).text('Se certifica que', 0, 168, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(24).text('JUAN PÉREZ GÓMEZ', 0, 188, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(11)
    .text('identificado(a) con cédula de ciudadanía No. 1037612345', 0, 222, { align: 'center' });
  doc.fontSize(12).text('aprobó satisfactoriamente el módulo', 0, 245, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text('Inducción ProAves', 0, 265, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(
    'Empresa: FUNDACIÓN PROAVES DE COLOMBIA    |    Fecha: ' + new Date().toLocaleDateString('es-CO') + '    |    Intensidad horaria: 4 horas',
    0, 298, { align: 'center' });

  const footerY = 340;
  doc.image(qrBuffer, 70, footerY, { fit: [75, 75] });
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
    .text('Código: MUESTRA-01', 50, footerY + 80, { width: 115, align: 'center' });
  doc.fontSize(8).text('Escanea para verificar', 50, footerY + 92, { width: 115, align: 'center' });

  const bW  = 200;
  const b1X = Math.round(W / 2) - bW - 15;
  const b2X = Math.round(W / 2) + 15;
  const lineY = footerY + 45;

  if (fs.existsSync(LOGO_FIRMA_CRISTINA)) doc.image(LOGO_FIRMA_CRISTINA, b1X + 10, footerY + 8, { fit: [180, 36] });
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

  if (fs.existsSync(LOGO_FIRMA_SUSANA)) doc.image(LOGO_FIRMA_SUSANA, b2X + 50, footerY + 8, { fit: [100, 32] });
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

  doc.moveTo(40, footerY + 100).lineTo(W - 40, footerY + 100).lineWidth(0.5).stroke('#CCCCCC');
  doc.fillColor(GRAY).font('Helvetica').fontSize(6.5)
    .text(LICENCIA_FORBE, 40, footerY + 108, { width: W - 80, align: 'justify' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(6)
    .text(POLITICA_DATOS, 40, footerY + 130, { width: W - 80, align: 'justify' });

  doc.end();
  await new Promise(r => out.on('finish', r));
  console.log('Listo:', outPath);
}

async function generarControlFuego() {
  const qrBuffer = await QRCode.toBuffer(
    'https://riesgo-backend-production.up.railway.app/api/verificar/MUESTRA-FUEGO',
    { width: 200 }
  );

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const outPath = path.join(__dirname, 'certificado-control-fuego.pdf');
  const out = fs.createWriteStream(outPath);
  doc.pipe(out);

  const NAVY   = '#0B1F3A';
  const YELLOW = '#FFC727';
  const GRAY   = '#5C554A';
  const W = doc.page.width;
  const H = doc.page.height;

  doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(NAVY);
  doc.rect(28, 28, W - 56, H - 56).lineWidth(1).stroke(YELLOW);

  // Logo izquierdo: RiesGO!
  if (fs.existsSync(LOGO_RIESGO)) doc.image(LOGO_RIESGO, 45, 35, { height: 50 });

  // Logo derecho: FORBE SAS
  if (fs.existsSync(LOGO_FORBE)) doc.image(LOGO_FORBE, W - 165, 35, { fit: [120, 50] });

  // Subtítulo
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
    .text('Programa de gamificación en Seguridad y Salud en el Trabajo (SST)', 0, 90, { align: 'center' });

  // Título
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28)
    .text('CERTIFICADO DE APROBACIÓN', 0, 108, { align: 'center' });

  doc.moveTo(W / 2 - 100, 148).lineTo(W / 2 + 100, 148).lineWidth(2).stroke(YELLOW);

  doc.fillColor(GRAY).font('Helvetica').fontSize(12).text('Se certifica que', 0, 168, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(24).text('JUAN PÉREZ GÓMEZ', 0, 188, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(11)
    .text('identificado(a) con cédula de ciudadanía No. 1037612345', 0, 222, { align: 'center' });
  doc.fontSize(12).text('aprobó satisfactoriamente el módulo', 0, 245, { align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18)
    .text('Control de Fuego Incipiente', 0, 265, { align: 'center' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(
    'Empresa: EMPRESA DE MUESTRA S.A.S.    |    Fecha: ' + new Date().toLocaleDateString('es-CO') + '    |    Intensidad horaria: 8 horas',
    0, 298, { align: 'center' });

  // Pie: QR izquierda, firma derecha
  const footerY = 340;
  doc.image(qrBuffer, 70, footerY, { fit: [75, 75] });
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
    .text('Código: MUESTRA-FUEGO', 50, footerY + 80, { width: 115, align: 'center' });
  doc.fontSize(8).text('Escanea para verificar', 50, footerY + 92, { width: 115, align: 'center' });

  const sigX  = W - 280;
  const lineY = footerY + 45;

  if (fs.existsSync(LOGO_FIRMA_SUSANA)) doc.image(LOGO_FIRMA_SUSANA, sigX + 50, footerY + 8, { fit: [100, 32] });
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
     .text('FORBE SAS', sigX, lineY + 29, { width: 200, align: 'center' });

  // Pie legal
  doc.moveTo(40, footerY + 100).lineTo(W - 40, footerY + 100).lineWidth(0.5).stroke('#CCCCCC');
  doc.fillColor(GRAY).font('Helvetica').fontSize(6.5)
    .text(LICENCIA_FORBE, 40, footerY + 108, { width: W - 80, align: 'justify' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(6)
    .text(POLITICA_DATOS, 40, footerY + 130, { width: W - 80, align: 'justify' });

  doc.end();
  await new Promise(r => out.on('finish', r));
  console.log('Listo:', outPath);
}

async function main() {
  await generarPasaporteANSV();
  await generarProAves();
  await generarControlFuego();
}

main().catch(console.error);
