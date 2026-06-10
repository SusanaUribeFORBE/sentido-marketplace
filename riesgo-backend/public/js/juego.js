const LIVES_INICIALES = 3;

const pinId = sessionStorage.getItem('riesgo_pin_id');
const moduloAsignado = sessionStorage.getItem('riesgo_modulo') || '';
const nombreUsuario = sessionStorage.getItem('riesgo_nombre') || '';

if (!pinId) {
  window.location.href = '/';
}

document.getElementById('nombre').textContent = nombreUsuario;
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

const gameContainer = document.getElementById('game-container');

if (!modulo) {
  gameContainer.innerHTML = `
    <p class="subtitle">El módulo "<strong>${moduloAsignado}</strong>" estará disponible muy pronto.</p>
    <p class="subtitle">Por ahora, contacta a tu coordinador SST.</p>
  `;
} else {
  iniciarJuego(modulo);
}

function iniciarJuego(modulo) {
  const preguntas = modulo.preguntas;
  let indice = 0;
  let vidas = LIVES_INICIALES;
  let aciertos = 0;

  document.getElementById('modulo-titulo').textContent = modulo.titulo;

  render();

  function render() {
    const p = preguntas[indice];
    const progreso = Math.round((indice / preguntas.length) * 100);

    gameContainer.innerHTML = `
      <div class="lives">${'❤️'.repeat(vidas)}${'🤍'.repeat(LIVES_INICIALES - vidas)}</div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${progreso}%"></div></div>
      <div class="score-line">Pregunta ${indice + 1} de ${preguntas.length} · Aciertos: ${aciertos}</div>
      <div class="scenario-emoji">${p.emoji}</div>
      <p class="scenario-text">${p.texto}</p>
      <p class="scenario-question">${p.pregunta}</p>
      <div class="options" id="opciones"></div>
      <div class="feedback" id="feedback" style="display:none"></div>
      <button class="next-btn" id="next-btn">Siguiente</button>
    `;

    const opcionesEl = document.getElementById('opciones');
    p.opciones.forEach((texto, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = texto;
      btn.addEventListener('click', () => responder(i));
      opcionesEl.appendChild(btn);
    });
  }

  function responder(seleccion) {
    const p = preguntas[indice];
    const botones = document.querySelectorAll('.option-btn');
    botones.forEach((b) => (b.disabled = true));

    const correcto = seleccion === p.correcta;

    botones[p.correcta].classList.add('correct');
    if (!correcto) {
      botones[seleccion].classList.add('incorrect');
      vidas -= 1;
    } else {
      aciertos += 1;
    }

    document.querySelector('.lives').innerHTML =
      '❤️'.repeat(vidas) + '🤍'.repeat(LIVES_INICIALES - vidas);

    const feedback = document.getElementById('feedback');
    feedback.style.display = 'block';
    feedback.textContent = (correcto ? '✅ ¡Correcto! ' : '❌ Incorrecto. ') + p.explicacion;

    const nextBtn = document.getElementById('next-btn');
    nextBtn.style.display = 'block';
    nextBtn.textContent = vidas === 0 ? 'Ver resultado' : 'Siguiente';
    nextBtn.addEventListener('click', () => {
      if (vidas === 0) {
        finalizar('reprobado');
        return;
      }
      indice += 1;
      if (indice >= preguntas.length) {
        finalizar('aprobado');
        return;
      }
      render();
    });
  }

  async function finalizar(resultado) {
    gameContainer.innerHTML = `<div class="spinner">Guardando resultado...</div>`;

    try {
      const res = await fetch('/api/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_id: pinId, resultado }),
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

      mostrarResultado(resultado, data, aciertos, preguntas.length);
    } catch (err) {
      gameContainer.innerHTML = `
        <div class="result-icon">⚠️</div>
        <p class="result-title">Error de conexión</p>
        <p class="result-detail">No se pudo guardar el resultado. Verifica tu conexión.</p>
      `;
    }
  }

  function mostrarResultado(resultado, data, aciertos, total) {
    if (resultado === 'aprobado') {
      const cert = data.certificado;
      gameContainer.innerHTML = `
        <div class="result-icon">🎉</div>
        <p class="result-title">¡Módulo aprobado!</p>
        <p class="result-detail">Respondiste correctamente ${aciertos} de ${total} preguntas.</p>
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
        <p class="result-detail">Respondiste correctamente ${aciertos} de ${total} preguntas.</p>
        <p class="result-detail">Solicita un nuevo PIN a tu coordinador SST para volver a intentarlo.</p>
      `;
    }
  }
}
