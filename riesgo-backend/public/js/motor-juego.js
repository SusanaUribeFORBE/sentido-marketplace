// Motor genérico reutilizable por los módulos de juego.
// Cada módulo define una secuencia de niveles (obstaculos | trivia)
// y delega en MotorJuego.iniciarSecuencia para encadenarlos y
// llamar a finalizar() solo si se superan todos.

window.MotorJuego = {
  iniciarSecuencia(container, niveles, finalizar) {
    let idx = 0;
    let totalAciertos = 0;
    let totalItems = 0;
    let detalleTotal = [];

    function jugarNivel() {
      const nivel = niveles[idx];
      const tituloEl = document.getElementById('modulo-titulo');
      if (tituloEl) tituloEl.textContent = nivel.config.nombre;

      const ejecutor =
        nivel.tipo === 'trivia'
          ? window.MotorJuego.ejecutarNivelTrivia
          : nivel.tipo === 'reaccion'
          ? window.MotorJuego.ejecutarNivelReaccion
          : window.MotorJuego.ejecutarNivelObstaculos;

      ejecutor(container, nivel.config, (resultado, aciertos, total, detalle) => {
        totalAciertos += aciertos;
        totalItems += total;
        if (detalle && detalle.length) {
          detalleTotal = detalleTotal.concat(
            detalle.map((d) => Object.assign({ nivel: nivel.config.nombre }, d))
          );
        }

        if (resultado === 'reprobado') {
          finalizar(
            'reprobado',
            `No superaste "${nivel.config.nombre}". Acertaste ${totalAciertos} de ${totalItems} en total.`,
            detalleTotal
          );
          return;
        }

        idx += 1;
        if (idx >= niveles.length) {
          finalizar(
            'aprobado',
            `¡Superaste los ${niveles.length} niveles! Acertaste ${totalAciertos} de ${totalItems} en total.`,
            detalleTotal
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

  // ===== Nivel tipo reacción (tap/swipe contra el reloj) =====
  // config: { nombre, instrucciones, retos: [{ tipo: 'tap-repetido'|'swipe-abajo'|'swipe-lateral', emoji, situacion, accionTexto, tapsRequeridos?, exito, fallo }] }
  ejecutarNivelReaccion(container, config, onFin) {
    const VIDAS_INICIALES = 3;
    const TIEMPO_LIMITE = 4500;

    let vidas = VIDAS_INICIALES;
    let indice = 0;
    let aciertos = 0;
    let activo = true;
    let resuelto = false;
    let tapsHechos = 0;
    let rafId = null;
    let inicioMs = 0;
    const detalle = [];

    render();

    function actualizarVidas() {
      const el = container.querySelector('.lives');
      if (el) {
        el.innerHTML = '❤️'.repeat(Math.max(vidas, 0)) + '🤍'.repeat(VIDAS_INICIALES - Math.max(vidas, 0));
      }
    }

    function gestoInstruccion(reto) {
      if (reto.tipo === 'tap-repetido') {
        return `👉 Toca el botón rápido, varias veces (${reto.tapsRequeridos || 5} veces)`;
      }
      if (reto.tipo === 'swipe-abajo') {
        return '👉 Dentro del recuadro, desliza el dedo (o el mouse) hacia abajo';
      }
      return '👉 Dentro del recuadro, desliza el dedo (o el mouse) de un lado al otro';
    }

    function render() {
      const reto = config.retos[indice];

      container.innerHTML = `
        <div class="lives">${'❤️'.repeat(vidas)}${'🤍'.repeat(VIDAS_INICIALES - vidas)}</div>
        <div class="score-line">Reto ${indice + 1} de ${config.retos.length}</div>
        <p class="arcade-instructions">${config.instrucciones}</p>
        <div class="reaccion-escena" id="reaccion-escena">
          <div class="reaccion-avatar" id="reaccion-avatar">🧍</div>
          <div class="reaccion-emoji">${reto.emoji}</div>
          <p class="reaccion-situacion">${reto.situacion}</p>
          <p class="reaccion-gesto">${gestoInstruccion(reto)}</p>
          <button type="button" class="reaccion-listo-btn" id="reaccion-listo-btn">¡Listo! Empezar</button>
          <div class="reaccion-timer" id="reaccion-timer" style="display:none"><div class="reaccion-timer-fill" id="timer-fill"></div></div>
          <div class="reaccion-zona zona-llamada" id="reaccion-zona" style="display:none">
            ${
              reto.tipo === 'tap-repetido'
                ? `<button type="button" class="reaccion-btn zona-llamada" id="reaccion-btn">${reto.accionTexto}</button>`
                : `<div class="reaccion-hint zona-llamada">${reto.accionTexto}</div>`
            }
          </div>
        </div>
        <div class="feedback" id="feedback" style="display:none"></div>
        <button class="next-btn" id="next-btn">Siguiente</button>
      `;

      document.getElementById('reaccion-listo-btn').addEventListener('click', () => {
        document.getElementById('reaccion-listo-btn').style.display = 'none';
        document.getElementById('reaccion-timer').style.display = '';
        document.getElementById('reaccion-zona').style.display = '';
        iniciarReto(reto);
      });
    }

    function iniciarReto(reto) {
      resuelto = false;
      tapsHechos = 0;
      inicioMs = performance.now();

      const timerFill = document.getElementById('timer-fill');
      const zona = document.getElementById('reaccion-zona');

      function tick() {
        if (resuelto || !activo) return;
        const transcurrido = performance.now() - inicioMs;
        const restante = Math.max(0, 1 - transcurrido / TIEMPO_LIMITE);
        timerFill.style.width = `${restante * 100}%`;

        if (transcurrido >= TIEMPO_LIMITE) {
          resolver(false);
          return;
        }

        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

      if (reto.tipo === 'tap-repetido') {
        const btn = document.getElementById('reaccion-btn');
        btn.addEventListener('pointerdown', () => {
          if (resuelto) return;
          tapsHechos += 1;
          btn.classList.remove('pulse');
          void btn.offsetWidth;
          btn.classList.add('pulse');
          if (tapsHechos >= (reto.tapsRequeridos || 5)) {
            resolver(true);
          }
        });
      } else {
        let startX = 0;
        let startY = 0;

        zona.addEventListener('pointerdown', (e) => {
          startX = e.clientX;
          startY = e.clientY;
        });

        zona.addEventListener('pointerup', (e) => {
          if (resuelto) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          if (reto.tipo === 'swipe-abajo' && dy > 40 && Math.abs(dy) > Math.abs(dx)) {
            resolver(true);
          } else if (reto.tipo === 'swipe-lateral' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            resolver(true);
          }
        });
      }
    }

    function resolver(exito) {
      if (resuelto || !activo) return;
      resuelto = true;
      cancelAnimationFrame(rafId);

      const reto = config.retos[indice];
      const escena = document.getElementById('reaccion-escena');
      const feedback = document.getElementById('feedback');

      feedback.style.display = 'block';

      detalle.push({
        pregunta_id: reto.id || `reto-${indice}`,
        pregunta_texto: reto.situacion,
        correcta: exito,
      });

      if (exito) {
        aciertos += 1;
        feedback.textContent = `✅ ${reto.exito}`;
        feedback.className = 'feedback feedback-ok';
      } else {
        vidas -= 1;
        actualizarVidas();
        escena.classList.add('crack');
        reproducirCrack();
        feedback.textContent = `💥 ¡Crack! ${reto.fallo}`;
        feedback.className = 'feedback feedback-bad';
      }

      const nextBtn = document.getElementById('next-btn');
      nextBtn.style.display = 'block';
      nextBtn.textContent = vidas <= 0 ? 'Ver resultado' : 'Siguiente';
      nextBtn.addEventListener('click', () => {
        if (vidas <= 0) {
          terminar('reprobado');
          return;
        }
        indice += 1;
        if (indice >= config.retos.length) {
          terminar('aprobado');
          return;
        }
        render();
      });
    }

    function terminar(resultado) {
      if (!activo) return;
      activo = false;
      cancelAnimationFrame(rafId);
      onFin(resultado, aciertos, config.retos.length, detalle);
    }
  },

  // ===== Nivel tipo trivia (quiz de escenarios con vidas) =====
  // config: { nombre, preguntas: [{ emoji, texto, pregunta, opciones, correcta, explicacion }] }
  ejecutarNivelTrivia(container, config, onFin) {
    const VIDAS_INICIALES = 3;
    const preguntas = config.preguntas;

    let indice = 0;
    let vidas = VIDAS_INICIALES;
    let aciertos = 0;
    const detalle = [];

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

      detalle.push({
        pregunta_id: p.id || `pregunta-${indice}`,
        pregunta_texto: p.pregunta,
        correcta: correcto,
      });

      botones[p.correcta].classList.add('correct');
      if (!correcto) {
        botones[seleccion].classList.add('incorrect');
        botones[p.correcta].insertAdjacentHTML('beforeend', ' ✅');
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
          onFin('reprobado', aciertos, preguntas.length, detalle);
          return;
        }
        indice += 1;
        if (indice >= preguntas.length) {
          onFin('aprobado', aciertos, preguntas.length, detalle);
          return;
        }
        render();
      });
    }
  },
};

function reproducirCrack() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    // audio no disponible, se ignora
  }
}

function mostrarTransicion(container, siguienteConfig, onContinuar) {
  container.innerHTML = `
    <div class="result-icon">✅</div>
    <p class="result-title">¡Nivel superado!</p>
    <p class="result-detail">Siguiente: ${siguienteConfig.nombre}</p>
    <button id="continuar-btn">Continuar</button>
  `;
  document.getElementById('continuar-btn').addEventListener('click', onContinuar);
}
