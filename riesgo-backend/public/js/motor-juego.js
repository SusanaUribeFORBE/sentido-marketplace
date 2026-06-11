// Motor genérico reutilizable por los módulos de juego.
// Cada módulo define una secuencia de niveles (obstaculos | trivia)
// y delega en MotorJuego.iniciarSecuencia para encadenarlos y
// llamar a finalizar() solo si se superan todos.

window.MotorJuego = {
  iniciarSecuencia(container, niveles, finalizar) {
    let idx = 0;
    let totalAciertos = 0;
    let totalItems = 0;

    function jugarNivel() {
      const nivel = niveles[idx];
      const tituloEl = document.getElementById('modulo-titulo');
      if (tituloEl) tituloEl.textContent = nivel.config.nombre;

      const ejecutor =
        nivel.tipo === 'trivia'
          ? window.MotorJuego.ejecutarNivelTrivia
          : window.MotorJuego.ejecutarNivelObstaculos;

      ejecutor(container, nivel.config, (resultado, aciertos, total) => {
        totalAciertos += aciertos;
        totalItems += total;

        if (resultado === 'reprobado') {
          finalizar(
            'reprobado',
            `No superaste "${nivel.config.nombre}". Acertaste ${totalAciertos} de ${totalItems} en total.`
          );
          return;
        }

        idx += 1;
        if (idx >= niveles.length) {
          finalizar(
            'aprobado',
            `¡Superaste los ${niveles.length} niveles! Acertaste ${totalAciertos} de ${totalItems} en total.`
          );
        } else {
          mostrarTransicion(container, niveles[idx].config, jugarNivel);
        }
      });
    }

    jugarNivel();
  },

  // ===== Nivel tipo obstáculos (cazador de riesgos) =====
  // config: { nombre, instrucciones, total, intervalo, duracionCaida, tipos: string[], particulas?: {} }
  ejecutarNivelObstaculos(container, config, onFin) {
    const VIDAS_INICIALES = 3;
    const PARTICULAS = Object.assign({ default: '✨' }, config.particulas || {});

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
  },

  // ===== Nivel tipo trivia (quiz de escenarios con vidas) =====
  // config: { nombre, preguntas: [{ emoji, texto, pregunta, opciones, correcta, explicacion }] }
  ejecutarNivelTrivia(container, config, onFin) {
    const VIDAS_INICIALES = 3;
    const preguntas = config.preguntas;

    let indice = 0;
    let vidas = VIDAS_INICIALES;
    let aciertos = 0;

    render();

    function render() {
      const p = preguntas[indice];
      const progreso = Math.round((indice / preguntas.length) * 100);

      container.innerHTML = `
        <div class="lives">${'❤️'.repeat(vidas)}${'🤍'.repeat(VIDAS_INICIALES - vidas)}</div>
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
        '❤️'.repeat(Math.max(vidas, 0)) + '🤍'.repeat(VIDAS_INICIALES - Math.max(vidas, 0));

      const feedback = document.getElementById('feedback');
      feedback.style.display = 'block';
      feedback.textContent = (correcto ? '✅ ¡Correcto! ' : '❌ Incorrecto. ') + p.explicacion;

      const nextBtn = document.getElementById('next-btn');
      nextBtn.style.display = 'block';
      nextBtn.textContent = vidas <= 0 ? 'Ver resultado' : 'Siguiente';
      nextBtn.addEventListener('click', () => {
        if (vidas <= 0) {
          onFin('reprobado', aciertos, preguntas.length);
          return;
        }
        indice += 1;
        if (indice >= preguntas.length) {
          onFin('aprobado', aciertos, preguntas.length);
          return;
        }
        render();
      });
    }
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
