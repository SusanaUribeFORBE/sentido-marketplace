const pinId = sessionStorage.getItem('riesgo_pin_id');
const moduloAsignado = sessionStorage.getItem('riesgo_modulo') || '';
const nombreUsuario = sessionStorage.getItem('riesgo_nombre') || '';
const nombreEmpresa = sessionStorage.getItem('riesgo_empresa') || '';

if (!pinId) {
  window.location.href = '/';
}

document.getElementById('nombre').textContent = nombreUsuario;
document.getElementById('empresa').textContent = nombreEmpresa;
document.getElementById('modulo-titulo').textContent = moduloAsignado;

function normalizarClave(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const moduloKey = normalizarClave(moduloAsignado);
const modulo = (window.MODULOS || {})[moduloKey];

const LOGOS_MODULO = {
  seguridadvial: '/assets/logo-riesgovial.png',
  riesgoscriticosviales: '/assets/logo-riesgovial.png',
  antesdearrancar: '/assets/logo-riesgovial.png',
  rutasegura: '/assets/logo-riesgovial.png',
  pasvialemergenciasenruta: '/assets/logo-riesgovial.png',
  liderazgovial: '/assets/logo-riesgovial.png',
};

if (LOGOS_MODULO[moduloKey]) {
  document.querySelector('.game-header .logo').src = LOGOS_MODULO[moduloKey];
}

const gameContainer = document.getElementById('game-container');

if (!modulo) {
  gameContainer.innerHTML = `
    <p class="subtitle">El módulo "<strong>${moduloAsignado}</strong>" estará disponible muy pronto.</p>
    <p class="subtitle">Por ahora, contacta a tu coordinador SST.</p>
  `;
} else {
  document.getElementById('modulo-titulo').textContent = modulo.titulo;
  modulo.iniciar(gameContainer, { finalizar });
}

let finalizando = false;

async function finalizar(resultado, resumenTexto, detalle) {
  if (finalizando) return;
  finalizando = true;

  gameContainer.innerHTML = `<div class="spinner">Guardando resultado...</div>`;

  try {
    const res = await fetch('/api/finalizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_id: pinId, resultado, detalle: detalle || [] }),
    });

    const data = await res.json();

    if (!res.ok) {
      gameContainer.innerHTML = `
        <div class="result-icon">⚠️</div>
        <p class="result-title">Ocurrió un problema</p>
        <p class="result-detail">${data.error || 'No se pudo guardar el resultado.'}</p>
      `;
      return;
    }

    mostrarResultado(resultado, data, resumenTexto);
  } catch (err) {
    gameContainer.innerHTML = `
      <div class="result-icon">⚠️</div>
      <p class="result-title">Error de conexión</p>
      <p class="result-detail">No se pudo guardar el resultado. Verifica tu conexión.</p>
    `;
  }
}

function mostrarResultado(resultado, data, resumenTexto) {
  if (resultado === 'aprobado') {
    const cert = data.certificado;
    gameContainer.innerHTML = `
      <div class="result-icon">🎉</div>
      <p class="result-title">¡Módulo aprobado!</p>
      <p class="result-detail">${resumenTexto || ''}</p>
      ${
        cert
          ? `<a class="result-link" href="${cert.url_pdf}" target="_blank" rel="noopener">Descargar certificado</a>
             <p class="result-detail">${cert.enviado_a ? `Enviado a ${cert.enviado_a}` : ''}</p>`
          : ''
      }
    `;
  } else {
    gameContainer.innerHTML = `
      <div class="result-icon">😕</div>
      <p class="result-title">Módulo no aprobado</p>
      <p class="result-detail">${resumenTexto || ''}</p>
      <p class="result-detail">Solicita un nuevo PIN a tu coordinador SST para volver a intentarlo.</p>
    `;
  }
}
