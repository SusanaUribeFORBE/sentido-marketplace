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
  controladoresviales: '/assets/logo-riesgovial.png',
  cascoquesalva: '/assets/logo-riesgovial.png',
  velocidadysupervivencia: '/assets/logo-riesgovial.png',
  motoenbuenestado: '/assets/logo-riesgovial.png',
  motoytrabajo: '/assets/logo-riesgovial.png',
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

// URL de animaciones Lottie — reemplaza con las que elijas en lottiefiles.com
const LOTTIE = {
  exito: 'https://assets10.lottiefiles.com/packages/lf20_touohxv0.json',
  fallo: 'https://assets5.lottiefiles.com/packages/lf20_qp1q7mct.json',
};

function lottieTag(url, size) {
  return `<lottie-player src="${url}" background="transparent" speed="1" style="width:${size}px;height:${size}px;margin:0 auto" autoplay></lottie-player>`;
}

function generarCodigoIncentivo(pinId) {
  return 'AUTECO-' + pinId.replace(/-/g, '').slice(-6).toUpperCase();
}

const INSIGNIA_LABELS = {
  equipamiento: '🪖 Equipamiento que te protege',
  normas: '🛣️ Normas que salvan',
  atencion: '👁️ Atención que te adelanta',
  tumoto: '🏍️ Tu moto en buen estado',
  condiciones: '🌧️ Condiciones que importan',
  respeto: '❤️ Respeto que nos une',
};

function mostrarResultado(resultado, data, resumenTexto) {
  if (resultado === 'aprobado') {
    const cert = data.certificado;
    const incentivo = modulo && modulo.incentivo;
    const pasaporte = data.pasaporte;
    gameContainer.innerHTML = `
      ${lottieTag(LOTTIE.exito, 180)}
      <p class="result-title">¡Módulo aprobado!</p>
      <p class="result-detail">${resumenTexto || ''}</p>
      ${
        pasaporte
          ? `<div class="incentivo-box">
               <p class="incentivo-titulo">🪪 Pasaporte de Movilidad Segura: nivel ${pasaporte.nivel}</p>
               <p class="incentivo-codigo">+${pasaporte.puntosGanados} pts (total: ${pasaporte.puntosTotal})</p>
               ${
                 pasaporte.insigniasNuevas && pasaporte.insigniasNuevas.length
                   ? `<p class="incentivo-detalle">Nueva insignia: ${pasaporte.insigniasNuevas.map((i) => INSIGNIA_LABELS[i] || i).join(', ')}</p>`
                   : ''
               }
               <a class="result-detail" href="/pasaporte.html" target="_blank" rel="noopener">Ver mi pasaporte completo →</a>
             </div>`
          : ''
      }
      ${
        incentivo
          ? `<div class="incentivo-box">
               <p class="incentivo-titulo">${incentivo.titulo}</p>
               <p class="incentivo-codigo">${generarCodigoIncentivo(pinId)}</p>
               <p class="incentivo-detalle">${incentivo.descripcion}</p>
             </div>`
          : ''
      }
      ${
        cert
          ? `<p class="result-detail">🎓 Tu certificado fue enviado a <strong>${cert.enviado_a || 'tu coordinador SST'}</strong></p>`
          : ''
      }
    `;
  } else {
    gameContainer.innerHTML = `
      ${lottieTag(LOTTIE.fallo, 140)}
      <p class="result-title">Módulo no aprobado</p>
      <p class="result-detail">${resumenTexto || ''}</p>
      <p class="result-detail">Solicita un nuevo PIN a tu coordinador SST para volver a intentarlo.</p>
    `;
  }
}
