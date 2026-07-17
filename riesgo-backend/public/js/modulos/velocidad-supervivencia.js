window.MODULOS['velocidadysupervivencia'] = {
  titulo: 'Velocidad y Supervivencia',
  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ── NIVEL 1: Los números de la velocidad ──────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 1: Los números de la velocidad',
          preguntas: [
            {
              emoji: '🏢',
              pregunta: 'Ir a 80 km/h y sufrir un impacto equivale aproximadamente a:',
              opciones: [
                'Caer desde una silla',
                'Caer desde el tercer piso',
                'Caer desde el quinto piso o más',
                'Un golpe fuerte de boxeo',
              ],
              correcta: 2,
              explicacion: 'Según el BID (2026), la energía cinética a 80 km/h es equivalente a caer desde el quinto piso. A esa velocidad, ningún cuerpo humano tiene posibilidad real de sobrevivir un impacto directo.',
            },
            {
              emoji: '📏',
              pregunta: 'A 60 km/h, una moto promedio necesita aproximadamente para frenar completamente:',
              opciones: [
                '5 metros (menos que un carro)',
                '20 a 25 metros (más de dos camionetas de largo)',
                '50 metros (media cuadra)',
                '3 metros si el piso está seco',
              ],
              correcta: 1,
              explicacion: 'A 60 km/h, incluso con buenas llantas y frenos en perfecto estado, una moto necesita entre 20 y 25 metros para detenerse. Si el piso está mojado, ese número puede duplicarse.',
            },
            {
              emoji: '⚡',
              pregunta: '¿Qué hace el sistema ABS (Anti-lock Braking System) en una moto?',
              opciones: [
                'Frena más fuerte que los frenos convencionales',
                'Impide que las ruedas se bloqueen, manteniendo el control de dirección en frenadas de emergencia',
                'Solo funciona en lluvia y superficies mojadas',
                'Reduce el consumo de combustible',
              ],
              correcta: 1,
              explicacion: 'El ABS evita que las ruedas se bloqueen y permiten al motociclista mantener la dirección mientras frena. Sin ABS, al bloquear la rueda delantera la moto cae instantáneamente.',
            },
            {
              emoji: '🚧',
              pregunta: 'La instalación de resaltos parabólicos en Bogotá (estudio WRI 2024) redujo la velocidad de motos en:',
              opciones: [
                '2 km/h (insignificante)',
                '5 km/h',
                '9 km/h en promedio (de 30 a 21 km/h)',
                '20 km/h',
              ],
              correcta: 2,
              explicacion: 'El estudio WRI/Bogotá 2024 demostró que los resaltos parabólicos redujeron la velocidad promedio de las motos 9 km/h. En el piloto en Avenida Guayacanes: cero muertes y cero heridos en moto desde agosto 2024.',
            },
            {
              emoji: '👁️',
              pregunta: 'A mayor velocidad, el tiempo disponible para reaccionar ante un obstáculo:',
              opciones: [
                'Se mantiene igual porque el motociclista es más experimentado',
                'Aumenta porque se ve más lejos',
                'Disminuye: se necesita más espacio pero hay menos tiempo para decidir',
                'No cambia si usas casco integral',
              ],
              correcta: 2,
              explicacion: 'Con 1 segundo de tiempo de reacción, a 60 km/h ya recorriste 16.7 metros antes de empezar a frenar. A 100 km/h son 27.8 metros. La distancia necesaria crece, el tiempo para decidir desaparece.',
            },
          ],
        },
      },

      // ── NIVEL 2: Decisiones a la velocidad correcta ───────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 2: Decisiones a la velocidad correcta',
          instrucciones: 'Desliza ✅ si la decisión es segura o ❌ si pone en riesgo tu vida.',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '⏰',
              situacion: 'Llegas tarde al trabajo. La vía está despejada. Subes a 90 km/h en una zona de 60.',
              accionTexto: '¿Lo haces?',
              exito: 'Correcto. Ir 30 km/h sobre el límite cuadruplica la energía de impacto. Llegar tarde no vale el riesgo de no llegar.',
              fallo: 'A 90 km/h en zona de 60 cuadricas la energía de impacto. Una emergencia a esa velocidad no tiene solución.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🚗',
              situacion: 'Hay un trancón adelante. Vas a 40 km/h y tienes espacio de seguridad con el vehículo de adelante.',
              accionTexto: '¿Mantienes esa velocidad y distancia?',
              exito: 'Perfecto. La distancia de seguridad a 40 km/h debe ser al menos 15 metros. La mantuviste — eso te da tiempo de reacción.',
              fallo: 'A 40 km/h necesitas mínimo 15 metros para frenar. La distancia de seguridad es lo que te salva cuando el de adelante frena de golpe.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🌧️',
              situacion: 'Llueve. La vía tiene pintura horizontal reciente. Quieres acelerar para pasar esa zona rápido.',
              accionTexto: '¿Aceleras?',
              exito: 'Correcto. La pintura mojada puede multiplicar por 3 la distancia de frenado. La velocidad correcta en ese tramo es mínima, no máxima.',
              fallo: 'Error grave. La pintura horizontal mojada reduce drásticamente la fricción. Acelerar en esa zona es como frenar en hielo.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🌙',
              situacion: 'Es de noche y la vía está aparentemente despejada. No hay otros vehículos visibles.',
              accionTexto: '¿Reduces velocidad respecto al límite diurno?',
              exito: 'Exacto. De noche la distancia de visibilidad cae drásticamente. Un obstáculo en la vía puede aparecer cuando ya no hay tiempo de frenar.',
              fallo: 'De noche el alcance de los faros limita cuánto puedes ver. Si algo aparece fuera de esa zona, ya no puedes reaccionar a tiempo.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🚦',
              situacion: 'El semáforo cambia a amarillo cuando estás a 50 metros. Vas a 70 km/h.',
              accionTexto: '¿Aceleras para pasar antes de que cierre?',
              exito: 'Bien. A 70 km/h necesitas más de 35 metros solo para frenar. Ese semáforo ya cerró cuando decidiste acelerar.',
              fallo: 'A 70 km/h tu distancia de frenado supera los 35 metros. Cuando el semáforo cierra y alguien cruza, ya no puedes parar.',
            },
          ],
        },
      },

      // ── NIVEL 3: Velocidad, infraestructura y zonas de riesgo ─────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 3: Infraestructura y zonas de riesgo',
          preguntas: [
            {
              emoji: '🛣️',
              pregunta: 'Según el estudio WRI/BID, ¿qué factor de infraestructura urbana reduce más las lesiones de motociclistas?',
              opciones: [
                'Más carriles para aumentar la velocidad del tráfico',
                'Estaciones de BRT bien diseñadas y espacios públicos alrededor de la vía',
                'Puentes peatonales en zonas comerciales',
                'Apertura de medianas sin control de acceso',
              ],
              correcta: 1,
              explicacion: 'El estudio WRI en Bogotá y Buenos Aires demostró que las estaciones BRT bien diseñadas y los espacios públicos alrededor de la vía reducen las lesiones de motociclistas al ordenar el tráfico y reducir velocidades.',
            },
            {
              emoji: '🔩',
              pregunta: 'El riesgo de muerte de un motociclista al impactar contra una barrera de contención lateral es:',
              opciones: [
                'Igual que el de un ocupante de carro',
                '5 veces mayor que el de un carro',
                '80 veces mayor que el de un ocupante de carro',
                'Menor si lleva casco integral',
              ],
              correcta: 2,
              explicacion: 'Según CAF (2017) citado por el BID, el riesgo de muerte al impactar una barrera lateral es 80 veces mayor para un motociclista que para el ocupante de un carro, incluso con casco puesto.',
            },
            {
              emoji: '💧',
              pregunta: 'Las tapas de alcantarilla sin cubierta o con hundimientos representan para el motociclista:',
              opciones: [
                'Un riesgo menor que puede evitarse fácilmente',
                'Un peligro grave: la llanta puede quedar atrapada causando pérdida de control inmediata',
                'Solo un problema estético en la vía',
                'Un riesgo solo en lluvia',
              ],
              correcta: 1,
              explicacion: 'El BID identifica las tapas de alcantarilla dañadas como uno de los riesgos de infraestructura más letales para motos. Sus bordes y profundidad pueden atrapar la llanta en fracciones de segundo.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
