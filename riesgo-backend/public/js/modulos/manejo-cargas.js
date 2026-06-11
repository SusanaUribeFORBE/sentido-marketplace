window.MODULOS = window.MODULOS || {};

window.MODULOS['manejodecargasyergonomia'] = {
  titulo: 'Manejo de Cargas y Ergonomía',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 1: La Ruta del Bulto Seguro',
          instrucciones: '¡Reacciona en menos de 2 segundos a cada peligro del camino!',
          retos: [
            {
              tipo: 'tap-repetido',
              emoji: '🕳️🧱',
              situacion: 'Pisas una zona de terreno inestable y el bulto de cemento amenaza con separarse de tu pecho.',
              accionTexto: '¡ABRAZAR CARGA!',
              tapsRequeridos: 5,
              exito: 'Mantuviste el bulto pegado al cuerpo, reduciendo la carga en tu zona lumbar.',
              fallo: 'El bulto se separó de tu cuerpo y caminaste encorvado, dañando tu zona lumbar.',
            },
            {
              tipo: 'swipe-abajo',
              emoji: '🚧🔧',
              situacion: 'El camino pasa por debajo de un andamio o tubería baja.',
              accionTexto: '⬇️ Desliza hacia abajo para agacharte',
              exito: 'Hiciste una sentadilla perfecta: espalda recta, rodillas flexionadas.',
              fallo: 'Te doblaste por la cintura y golpeaste tu columna contra el tubo.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '👷📦',
              situacion: 'Un compañero quiere pasarte una caja extra que superaría el límite de carga manual.',
              accionTexto: '↔️ Desliza a un lado para rechazar la carga extra',
              exito: 'Rechazaste la carga extra: tu peso total sigue dentro del límite seguro.',
              fallo: 'Recibiste el peso extra, te venció y caíste de rodillas por el dolor lumbar.',
            },
          ],
        },
      },
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 2: Trivia de Manejo de Cargas y Ergonomía',
          preguntas: [
            {
              emoji: '📦🦴',
              texto: 'Necesitas levantar una caja pesada que está en el piso.',
              pregunta: '¿Cuál es la forma correcta de levantarla?',
              opciones: [
                'Doblando la espalda y manteniendo las piernas rectas',
                'Flexionando las rodillas, espalda recta y la carga pegada al cuerpo',
                'Girando la cintura mientras levantas la carga',
                'Levantándola rápido para no esforzarte tanto tiempo',
              ],
              correcta: 1,
              explicacion: 'Para levantar cargas se deben flexionar las rodillas, mantener la espalda recta y acercar la carga al cuerpo, usando la fuerza de las piernas.',
            },
            {
              emoji: '🏋️⚠️',
              texto: 'Un material pesa más de lo que puedes cargar tú solo de forma segura.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Cargarlo de todas formas, aunque te tome varios intentos',
                'Pedir ayuda a un compañero o usar un equipo mecánico (carretilla, montacargas)',
                'Arrastrarlo con los pies para no levantarlo',
                'Dividir la carga en tu espalda y hombros al mismo tiempo',
              ],
              correcta: 1,
              explicacion: 'Cuando una carga supera tu capacidad segura, se debe solicitar ayuda o usar ayudas mecánicas para evitar lesiones musculoesqueléticas.',
            },
            {
              emoji: '🔄🧍',
              texto: 'Mientras cargas una caja, necesitas colocarla a un lado tuyo.',
              pregunta: '¿Cómo debes hacerlo correctamente?',
              opciones: [
                'Girando solo la cintura mientras sostienes la carga',
                'Moviendo los pies para girar todo el cuerpo, sin torcer la espalda',
                'Lanzando la caja hacia el lado',
                'Inclinando el tronco hacia el lado contrario',
              ],
              correcta: 1,
              explicacion: 'Para cambiar de dirección con una carga se deben mover los pies y girar todo el cuerpo, evitando torsiones de la columna.',
            },
            {
              emoji: '📚⬆️',
              texto: 'Debes guardar una caja pesada en una repisa que está por encima de tu cabeza.',
              pregunta: '¿Cuál es el riesgo principal de esta acción?',
              opciones: [
                'Ninguno, es una tarea normal',
                'Lesiones en hombros y espalda por el esfuerzo y la postura',
                'Que la repisa se vea desordenada',
                'Demorar más tiempo en la tarea',
              ],
              correcta: 1,
              explicacion: 'Levantar o almacenar cargas por encima de los hombros aumenta el riesgo de lesiones en hombros, cuello y espalda. Los objetos pesados deben ubicarse a la altura de la cintura.',
            },
            {
              emoji: '🪑⏳',
              texto: 'Llevas más de una hora realizando una tarea agachado o en una postura forzada.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Continuar hasta terminar la tarea sin parar',
                'Tomar pausas activas y hacer estiramientos periódicamente',
                'Cambiar de postura solo si sientes dolor fuerte',
                'Pedirle a otro compañero que termine la tarea por ti',
              ],
              correcta: 1,
              explicacion: 'Las pausas activas y los estiramientos periódicos previenen los trastornos musculoesqueléticos asociados a posturas prolongadas o forzadas.',
            },
            {
              emoji: '🛒↔️',
              texto: 'Tienes que mover una carretilla cargada de materiales por la obra.',
              pregunta: '¿Qué es más recomendable para tu cuerpo?',
              opciones: [
                'Halar la carretilla caminando hacia atrás',
                'Empujar la carretilla caminando hacia adelante',
                'Levantarla y cargarla en brazos',
                'Arrastrarla de lado',
              ],
              correcta: 1,
              explicacion: 'Empujar una carga es generalmente menos lesivo para la espalda que halarla, además de dar mejor visibilidad del camino.',
            },
            {
              emoji: '🤝📦',
              texto: 'Tú y un compañero van a levantar juntos una carga larga y pesada.',
              pregunta: '¿Qué deben hacer para hacerlo de forma segura?',
              opciones: [
                'Cada uno levanta a su propio ritmo, sin coordinarse',
                'Coordinar los movimientos y comunicarse durante todo el levantamiento',
                'Dejar que la persona más fuerte cargue la mayor parte del peso',
                'Levantarla rápido para terminar antes',
              ],
              correcta: 1,
              explicacion: 'En levantamientos entre dos o más personas, la coordinación y comunicación constante evitan movimientos bruscos y lesiones.',
            },
            {
              emoji: '🗄️📏',
              texto: 'Estás organizando el almacenamiento de materiales pesados en la bodega.',
              pregunta: '¿Dónde deben ubicarse los elementos más pesados?',
              opciones: [
                'En las repisas más altas, para aprovechar el espacio',
                'A una altura entre la cintura y los hombros, de fácil alcance',
                'En el piso, sin ningún orden',
                'No importa la altura, solo que quepan',
              ],
              correcta: 1,
              explicacion: 'Los elementos más pesados deben almacenarse entre la altura de la cintura y los hombros, para reducir el esfuerzo y el riesgo al levantarlos.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
