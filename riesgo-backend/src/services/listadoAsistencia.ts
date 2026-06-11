import ExcelJS from 'exceljs';

const PROVEEDOR_NOMBRE = 'FORMACION DE BRIGADAS DE EMERGENCIA SAS';
const PROVEEDOR_NIT = '901048333';

const ACTIVIDAD_POR_MODULO: Record<string, string> = {
  'Orden y Aseo': 'SIG084 - CAP SG-SST ESP',
  'Manejo de Cargas y Ergonomía': 'ERG053 - CAP PELIGRO BIOMECANICO ESP',
};

interface Participante {
  nombre_usuario: string;
  cedula_usuario: string;
  cargo: string | null;
  celular: string | null;
  fecha_uso: string | null;
  estado: string;
}

interface ListadoParams {
  nombreEmpresa: string;
  nitEmpresa: string;
  modulo: string;
  participantes: Participante[];
}

export async function generarListadoAsistencia(params: ListadoParams): Promise<ExcelJS.Buffer> {
  const { nombreEmpresa, nitEmpresa, modulo, participantes } = params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Listado de Asistencia');

  sheet.columns = [
    { width: 6 },
    { width: 32 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 22 },
    { width: 12 },
  ];

  const NAVY = 'FF0B1F3A';
  const titleRow = sheet.addRow(['FORMATO DE LISTADO DE ASISTENCIA - ARL AXA COLPATRIA']);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 8);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 24;
  titleRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  });

  sheet.addRow([]);

  const fechas = participantes
    .map((p) => p.fecha_uso)
    .filter((f): f is string => !!f)
    .sort();
  const fechaInicio = fechas[0] ? new Date(fechas[0]).toLocaleDateString('es-CO') : '';
  const fechaFin = fechas[fechas.length - 1] ? new Date(fechas[fechas.length - 1]).toLocaleDateString('es-CO') : '';
  const rangoFechas = fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} - ${fechaFin}`;

  const datosGenerales: [string, string, string, string][] = [
    ['Ciudad', '', 'Fecha(s) Ejecución', rangoFechas],
    ['Actividad', ACTIVIDAD_POR_MODULO[modulo] || modulo, 'Modalidad', 'Virtual'],
    ['Tema desarrollado', modulo, 'N° Participantes', String(participantes.length)],
    ['Empresa afiliada', nombreEmpresa, 'N° Afiliación (NIT)', nitEmpresa],
    ['Nombre proveedor', PROVEEDOR_NOMBRE, 'NIT proveedor', PROVEEDOR_NIT],
    ['N° Orden de servicio', '', 'Hora', ''],
  ];

  for (const [labelA, valueA, labelB, valueB] of datosGenerales) {
    const row = sheet.addRow(['', labelA, valueA, '', labelB, valueB, '', '']);
    sheet.mergeCells(row.number, 2, row.number, 2);
    sheet.mergeCells(row.number, 3, row.number, 4);
    sheet.mergeCells(row.number, 5, row.number, 5);
    sheet.mergeCells(row.number, 6, row.number, 8);
    row.getCell(2).font = { bold: true };
    row.getCell(5).font = { bold: true };
  }

  sheet.addRow([]);

  const headerRow = sheet.addRow([
    'N°',
    'NOMBRE',
    'IDENTIFICACIÓN',
    'CARGO',
    'CELULAR',
    'CONTRATISTA (SI O NO)',
    'FECHA DE LA ACTIVIDAD Y/O EXAMEN',
    'APTO (SI/NO)',
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  participantes.forEach((p, i) => {
    sheet.addRow([
      i + 1,
      p.nombre_usuario,
      p.cedula_usuario,
      p.cargo || '',
      p.celular || '',
      '',
      p.fecha_uso ? new Date(p.fecha_uso).toLocaleDateString('es-CO') : '',
      p.estado === 'Certificado' ? 'SI' : 'NO',
    ]);
  });

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  };

  for (let r = headerRow.number; r <= sheet.rowCount; r++) {
    sheet.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderStyle;
    });
  }

  return workbook.xlsx.writeBuffer();
}
