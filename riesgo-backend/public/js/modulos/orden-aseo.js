window.MODULOS = window.MODULOS || {};

window.MODULOS['ordenyaseo'] = {
  titulo: 'Orden y Aseo',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        nombre: 'Nivel 1: El Pasillo de los Tropezones',
        instrucciones: '¡Toca los obstáculos antes de que el obrero tropiece!',
        total: 12,
        intervalo: 1100,
        duracionCaida: 3200,
        tipos: ['🔌', '💧', '🪵'],
      },
      {
        nombre: 'Nivel 2: La Zona de Acopio',
        instrucciones: 'Materiales mal ubicados bloquean el paso. ¡Despéjalos rápido!',
        total: 14,
        intervalo: 950,
        duracionCaida: 2800,
        tipos: ['🧱', '🔩', '🪨', '🚛'],
      },
    ];

    let nivelActual = 0;
    let totalAciertos = 0;
    let totalObstaculos = 0;

    function jugarNivel() {
      const config = NIVELES[nivelActual];
      const tituloEl = document.getElementById('modulo-titulo');
      if (tituloEl) tituloEl.textContent = config.nombre;

      ejecutarNivelArcade(container, config, (resultado, aciertos, total) => {
        totalAciertos += aciertos;
        totalObstaculos += total;

        if (resultado === 'reprobado') {
          finalizar(
            'reprobado',
            `Te tropezaste demasiadas veces en "${config.nombre}". Despejaste ${totalAciertos} de ${totalObstaculos} obstáculos en total.`
          );
          return;
        }

        nivelActual += 1;
        if (nivelActual >= NIVELES.length) {
          finalizar(
            'aprobado',
            `¡Superaste los ${NIVELES.length} niveles! Despejaste ${totalAciertos} de ${totalObstaculos} obstáculos en total.`
          );
        } else {
          mostrarTransicion(container, NIVELES[nivelActual], jugarNivel);
        }
      });
    }

    jugarNivel();
  },
};

function mostrarTransicion(container, siguienteConfig, onContinuar) {
  container.innerHTML = `
    <div class="result-icon">✅</div>
    <p class="result-title">¡Nivel superado!</p>
    <p class="result-detail">Siguiente: ${siguienteConfig.nombre}</p>
    <button id="continuar-btn">Continuar</button>
  `;
  document.getElementById('continuar-btn').addEventListener('click', onContinuar);
}

function ejecutarNivelArcade(container, config, onFin) {
  const VIDAS_INICIALES = 3;
  const PARTICULAS = {
    '💧': '🟫',
    default: '✨',
  };

  let vidas = VIDAS_INICIALES;
  let spawnCount = 0;
  let resueltos = 0;
  let aciertos = 0;
  let activo = true;
  let spawnTimer = null;

  container.innerHTML = `
    <div class="arcade-game">
      <div class="arcade-hud">
        <div class="lives" id="arcade-lives">${'❤️'.repeat(vidas)}</div>
        <div class="arcade-score" id="arcade-score">Despejados: 0/${config.total}</div>
      </div>
      <p class="arcade-instructions">${config.instrucciones}</p>
      <div class="arcade-viewport" id="viewport">
        <div class="arcade-avatar" id="avatar">🧍</div>
      </div>
    </div>
  `;

  const viewport = document.getElementById('viewport');
  const avatar = document.getElementById('avatar');
  const livesEl = document.getElementById('arcade-lives');
  const scoreEl = document.getElementById('arcade-score');
  const LANES = [20, 50, 80];

  function actualizarHud() {
    livesEl.innerHTML = '❤️'.repeat(Math.max(vidas, 0)) + '🤍'.repeat(VIDAS_INICIALES - Math.max(vidas, 0));
    scoreEl.textContent = `Despejados: ${aciertos}/${config.total}`;
  }

  function mostrarParticula(emoji, leftPercent) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;
    p.style.left = `${leftPercent}%`;
    p.style.top = '70%';
    viewport.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }

  function tropezar() {
    vidas -= 1;
    actualizarHud();
    avatar.classList.remove('trip');
    void avatar.offsetWidth;
    avatar.classList.add('trip');
    setTimeout(() => avatar.classList.remove('trip'), 600);

    if (vidas <= 0) {
      terminar('reprobado');
    }
  }

  function spawnObstaculo() {
    if (!activo) return;
    spawnCount += 1;

    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const tipo = config.tipos[Math.floor(Math.random() * config.tipos.length)];

    const el = document.createElement('div');
    el.className = 'obstacle';
    el.textContent = tipo;
    el.style.left = `${lane}%`;
    el.style.animationDuration = `${config.duracionCaida}ms`;

    let resuelto = false;

    el.addEventListener('pointerdown', () => {
      if (resuelto || !activo) return;
      resuelto = true;
      aciertos += 1;
      resueltos += 1;
      el.classList.add('cleared');
      mostrarParticula(PARTICULAS[tipo] || PARTICULAS.default, lane);
      actualizarHud();
      setTimeout(() => el.remove(), 250);
      comprobarFin();
    });

    el.addEventListener('animationend', () => {
      if (resuelto || !activo) return;
      resuelto = true;
      resueltos += 1;
      el.remove();
      tropezar();
      comprobarFin();
    });

    viewport.appendChild(el);

    if (spawnCount >= config.total) {
      clearInterval(spawnTimer);
    }
  }

  function comprobarFin() {
    if (!activo) return;
    if (resueltos >= config.total && vidas > 0) {
      terminar('aprobado');
    }
  }

  function terminar(resultado) {
    if (!activo) return;
    activo = false;
    clearInterval(spawnTimer);
    onFin(resultado, aciertos, config.total);
  }

  spawnTimer = setInterval(spawnObstaculo, config.intervalo);
  spawnObstaculo();
}
