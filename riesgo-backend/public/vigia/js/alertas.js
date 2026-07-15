// ============================================================
// VIGÍA — Lógica de generación de alertas SST (Colombia)
// ============================================================

// Meses de vigencia según tipo de examen (Res. 1843/2025)
const VIGENCIA = {
  'PRE-INGRESO':         12,
  'PERIODICO':           12,
  'RETIRO':              null,
  'EGRESO':              null,
  'POST-INCAPACIDAD':    12,
  'CAMBIO DE OCUPACION': 12,
  'RETORNO LABORAL':     12,
  'SEGUIMIENTO':          6,  // control médico: cada 6 meses por defecto
};

// ── Función principal ──────────────────────────────────────

function generarAlertas(examen, empleado, opciones) {
  const alertas = [];
  const vigenciaMeses = (opciones && opciones.vigenciaMeses) || 12;

  _alertaArl(empleado, examen, alertas);
  _alertaConcepto(examen, alertas);
  _alertaTemporalidadRestriccion(examen, alertas);
  _alertaPruebasProhibidas(examen, alertas);
  _alertaRecomendaciones(examen, alertas);
  _alertaRetornoLaboral(examen, alertas);
  _alertaSeguimiento(examen, alertas);
  _alertaProximoExamen(examen, alertas, vigenciaMeses);
  _alertaVencimineto(examen, alertas);

  return alertas;
}

// ── Reglas ────────────────────────────────────────────────

function _alertaArl(empleado, examen, alertas) {
  const arl  = (empleado.arl || '').trim().toUpperCase();
  const tipo = (examen.tipo  || '').toUpperCase();
  if (!arl || arl === 'NO REFIERE' || arl === 'NO APLICA' || arl === 'N/A') {
    if (tipo === 'PRE-INGRESO' || tipo === 'PREINGRESO') {
      alertas.push({
        nivel:   'SEGUIMIENTO',
        codigo:  'SIN_ARL',
        icono:   'ℹ️',
        titulo:  'ARL pendiente de afiliación',
        mensaje: 'No tiene ARL al momento del examen pre-ingreso. Es normal — la afiliación se realiza desde el primer día de trabajo.',
        accion:  'Vincular a una ARL antes del inicio de funciones (Ley 1562/2012).',
      });
    } else {
      alertas.push({
        nivel:   'CRITICO',
        codigo:  'SIN_ARL',
        icono:   '⚠️',
        titulo:  'Sin ARL registrada',
        mensaje: 'El empleado no tiene ARL registrada. La afiliación es obligatoria desde el primer día de trabajo (Ley 1562/2012, Art. 2).',
        accion:  'Verificar y registrar la ARL activa del empleado.',
      });
    }
  }
}

function _alertaConcepto(examen, alertas) {
  const c = (examen.concepto_aptitud || '').toUpperCase();

  if (c.includes('NO APTO')) {
    alertas.push({
      nivel:   'CRITICO',
      codigo:  'NO_APTO',
      icono:   '🚫',
      titulo:  'Concepto: NO APTO',
      mensaje: 'El médico ocupacional emitió concepto de NO APTO para el cargo.',
      accion:  'El empleado no puede ejercer el cargo. Revisar con el médico y evaluar reubicación.',
    });
    alertas.push({
      nivel:   'SEGUIMIENTO',
      codigo:  'NO_APTO_LEGAL',
      icono:   '⚖️',
      titulo:  'Verificar validez legal del concepto "NO APTO"',
      mensaje: 'Res. 1843/2025, Art. 19: este concepto solo aplica para conductores, trabajo en altura, espacios confinados, energía eléctrica, porte de armas o manipulación de alimentos.',
      accion:  'Si el cargo no pertenece a esas categorías, el concepto debe expresarse como restricciones temporales o permanentes.',
    });
    return;
  }

  if (c.includes('CON RESTRICCIONES') || c.includes('RESTRICCION')) {
    const lista = (examen.restricciones || []).join(' · ') || 'Ver informe médico';
    alertas.push({
      nivel:   'ADVERTENCIA',
      codigo:  'CON_RESTRICCIONES',
      icono:   '⚙️',
      titulo:  'Apto con restricciones',
      mensaje: `El empleado es apto pero con condiciones. Restricciones: ${lista}`,
      accion:  'Adaptar el puesto de trabajo según las restricciones. Documentar en el SG-SST.',
    });
  }
}

function _alertaTemporalidadRestriccion(examen, alertas) {
  const c = (examen.concepto_aptitud || '').toUpperCase();
  if (!c.includes('CON RESTRICCIONES') && !c.includes('RESTRICCION')) return;

  const temp  = (examen.restriccion_temporalidad || '').toUpperCase();
  const hasta = examen.restriccion_hasta;

  if (temp === 'TEMPORAL' && hasta) {
    const dias = _diasHasta(hasta);
    if (dias < 0) {
      alertas.push({
        nivel:   'ADVERTENCIA',
        codigo:  'RESTRICCION_VENCIDA',
        icono:   '⏰',
        titulo:  'Restricción temporal posiblemente vencida',
        mensaje: `La restricción temporal venció el ${_formatFecha(hasta)} (hace ${Math.abs(dias)} días).`,
        accion:  'Verificar con el médico si fue renovada o levantada. Actualizar el estado en el sistema.',
        fecha_limite: hasta,
      });
    } else if (dias <= 30) {
      alertas.push({
        nivel:   'SEGUIMIENTO',
        codigo:  'RESTRICCION_POR_VENCER',
        icono:   '📋',
        titulo:  `Restricción temporal vence en ${dias} días`,
        mensaje: `Las restricciones médicas tienen vigencia hasta el ${_formatFecha(hasta)}.`,
        accion:  'Programar evaluación de seguimiento con el médico ocupacional antes del vencimiento.',
        fecha_limite: hasta,
      });
    }
  } else if (temp === 'PERMANENTE') {
    alertas.push({
      nivel:   'SEGUIMIENTO',
      codigo:  'RESTRICCION_PERMANENTE',
      icono:   '🔒',
      titulo:  'Restricciones de carácter permanente',
      mensaje: 'El médico indicó que las restricciones son permanentes y deben mantenerse indefinidamente en el puesto.',
      accion:  'Documentar la adaptación permanente del puesto de trabajo en el SG-SST (Res. 1843/2025, Art. 19).',
    });
  }
}

function _alertaPruebasProhibidas(examen, alertas) {
  const texto = (examen.examenes_realizados || []).join(' ').toUpperCase();
  const prohibidas = [];
  if (/EMBARAZ|BHCG|\bHCG\b/.test(texto))      prohibidas.push('prueba de embarazo (BHCG)');
  if (/\bVIH\b|\bHIV\b/.test(texto))            prohibidas.push('prueba de VIH');
  if (/\bVDRL\b|SIFILIS|SÍFILIS/.test(texto))   prohibidas.push('VDRL / sífilis');
  if (prohibidas.length === 0) return;
  alertas.push({
    nivel:   'CRITICO',
    codigo:  'PRUEBA_PROHIBIDA',
    icono:   '🚨',
    titulo:  'Pruebas prohibidas como requisito laboral',
    mensaje: `Se detectaron: ${prohibidas.join(', ')}. Estas pruebas no pueden exigirse como condición de empleo (Res. 1843/2025, Arts. 21-23 · Ley 2114/2021).`,
    accion:  'Notificar a la IPS. No exigir estas pruebas para vinculación ni continuidad laboral. Riesgo legal para el empleador.',
  });
}

function _alertaRecomendaciones(examen, alertas) {
  const recs = examen.recomendaciones || [];
  recs.forEach(rec => {
    const fechaLimite = _sumarMeses(examen.fecha, 12);
    alertas.push({
      nivel:        'SEGUIMIENTO',
      codigo:       'RECOMENDACION',
      icono:        '📋',
      titulo:       rec,
      mensaje:      'Recomendación emitida por el médico ocupacional en el examen.',
      accion:       'Programar y documentar el cumplimiento de esta recomendación.',
      fecha_limite: fechaLimite,
    });
  });
}

function _alertaRetornoLaboral(examen, alertas) {
  if (examen.tipo?.toUpperCase() !== 'RETORNO LABORAL') return;
  alertas.push({
    nivel:   'ADVERTENCIA',
    codigo:  'RETORNO_LABORAL',
    icono:   '🔄',
    titulo:  'Examen de retorno laboral',
    mensaje: 'El trabajador regresó de una ausencia de 90 o más días por causas no médicas. Este examen debe realizarse ANTES de reintegrar al empleado (Res. 1843/2025, Art. 12).',
    accion:  'Verificar que el examen fue realizado previo al regreso y archivar en la historia clínica.',
  });
}

function _alertaSeguimiento(examen, alertas) {
  if (examen.tipo?.toUpperCase() !== 'SEGUIMIENTO') return;
  alertas.push({
    nivel:   'ADVERTENCIA',
    codigo:  'SEGUIMIENTO_CONTROL',
    icono:   '🔍',
    titulo:  'Examen de seguimiento / control',
    mensaje: 'Evaluación para monitorear la evolución de una condición de salud identificada en un examen previo (Res. 1843/2025, Art. 8).',
    accion:  'Comparar con el examen anterior, verificar cumplimiento de restricciones y agendar próximo control en 6 meses (o según indicación médica).',
  });
}

function _alertaProximoExamen(examen, alertas, vigenciaMeses) {
  const tipo = examen.tipo?.toUpperCase();
  if (tipo === 'RETIRO' || tipo === 'EGRESO') return;

  // SEGUIMIENTO: control médico fijo a 6 meses; demás tipos: vigencia configurada por empresa
  const meses = tipo === 'SEGUIMIENTO' ? 6 : (vigenciaMeses || 12);
  const fechaProximo = _sumarMeses(examen.fecha, meses);
  const diasRestantes = _diasHasta(fechaProximo);

  if (diasRestantes <= 60 && diasRestantes >= 0) {
    alertas.push({
      nivel:        'ADVERTENCIA',
      codigo:       'EXAMEN_POR_VENCER',
      icono:        '📅',
      titulo:       'Examen próximo a vencer',
      mensaje:      `El examen periódico vence en ${diasRestantes} días (${_formatFecha(fechaProximo)}).`,
      accion:       'Programar el siguiente examen médico ocupacional.',
      fecha_limite: fechaProximo,
    });
  } else if (diasRestantes < 0) {
    alertas.push({
      nivel:        'CRITICO',
      codigo:       'EXAMEN_VENCIDO',
      icono:        '🔴',
      titulo:       'Examen médico vencido',
      mensaje:      `El examen venció el ${_formatFecha(fechaProximo)} (hace ${Math.abs(diasRestantes)} días).`,
      accion:       'Realizar el examen médico periódico de forma inmediata.',
      fecha_limite: fechaProximo,
    });
  } else {
    alertas.push({
      nivel:        'SEGUIMIENTO',
      codigo:       'PROXIMO_EXAMEN',
      icono:        '📅',
      titulo:       'Próximo examen periódico',
      mensaje:      `Programar el siguiente examen médico antes del ${_formatFecha(fechaProximo)}.`,
      accion:       'Agendar con la IPS con anticipación.',
      fecha_limite: fechaProximo,
    });
  }
}

function _alertaVencimineto(examen, alertas) {
  const tipo = examen.tipo?.toUpperCase();
  if (tipo === 'RETIRO' || tipo === 'EGRESO') {
    alertas.push({
      nivel:   'SEGUIMIENTO',
      codigo:  'EXAMEN_EGRESO_OK',
      icono:   '✅',
      titulo:  'Examen de egreso realizado',
      mensaje: `Examen de egreso completado el ${_formatFecha(examen.fecha)}.`,
      accion:  'Archivar en la historia clínica. Debe realizarse dentro de los 5 días hábiles siguientes a la terminación del contrato (Res. 1843/2025, Art. 11).',
    });
  }
}

// ── Helpers de fecha ──────────────────────────────────────

function _sumarMeses(fechaStr, meses) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr + 'T00:00:00');
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().split('T')[0];
}

function _diasHasta(fechaStr) {
  if (!fechaStr) return 999;
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const meta = new Date(fechaStr + 'T00:00:00');
  return Math.round((meta - hoy) / 86400000);
}

function _formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const [y, m, d] = fechaStr.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[+m-1]} ${y}`;
}

// ── Render de alertas (HTML) ──────────────────────────────

function renderAlertaCard(alerta) {
  const nivelClass = alerta.nivel.toLowerCase();
  const fechaHtml  = alerta.fecha_limite
    ? `<p class="alerta-fecha">📅 Fecha límite: ${_formatFecha(alerta.fecha_limite)}</p>`
    : '';
  return `
    <div class="alerta-card ${nivelClass}">
      <div class="alerta-icon">${alerta.icono}</div>
      <div class="alerta-body">
        <h4>${alerta.titulo}</h4>
        <p>${alerta.mensaje}</p>
        <p class="alerta-accion">${alerta.accion}</p>
        ${fechaHtml}
      </div>
    </div>`;
}

function renderBadgeNivel(nivel) {
  const map = {
    CRITICO:     ['badge-critico',     '● Crítico'],
    ADVERTENCIA: ['badge-advertencia', '● Advertencia'],
    SEGUIMIENTO: ['badge-seguimiento', '● Seguimiento'],
    OK:          ['badge-ok',          '● Al día'],
  };
  const [cls, label] = map[nivel] || map.OK;
  return `<span class="badge ${cls}">${label}</span>`;
}
