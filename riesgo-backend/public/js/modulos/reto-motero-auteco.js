window.MODULOS = window.MODULOS || {};

window.MODULOS['retomoteroauteco'] = {
  titulo: 'Reto del Motero Auteco',

  // Al aprobar, juego.js muestra esta caja con un código de descuento para el concesionario.
  incentivo: {
    titulo: '🎁 ¡Beneficio Auteco desbloqueado!',
    descripcion: 'Presenta este código en tu concesionario para reclamar tu beneficio de bienvenida.',
  },

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Reto 1: Reflejos en la vía',
          instrucciones: '¡5 minutos para demostrar que sabes rodar seguro! Lee la situación y reacciona a tiempo.',
          retos: [
            {
              id: 'motero-punto-ciego-camion',
              categoria: 'atencion',
              tipo: 'swipe-lateral',
              emoji: '🚛👁️',
              situacion: 'Vas a adelantar un camión grande en la vía y notas que no puedes ver su espejo retrovisor: estás en su punto ciego.',
              accionTexto: '↔️ Desliza para alejarte y esperar a tener visibilidad clara antes de adelantar',
              exito: 'Te alejaste del punto ciego: si no ves el espejo del conductor, él tampoco te ve a ti.',
              fallo: 'Seguiste en el punto ciego del camión, un lugar donde el conductor no puede verte.',
            },
            {
              id: 'motero-frenado-lluvia',
              categoria: 'condiciones',
              tipo: 'tap-repetido',
              emoji: '🌧️🛑',
              situacion: 'La vía está mojada por la lluvia y el vehículo de adelante frena de repente.',
              accionTexto: '¡FRENA DE FORMA PROGRESIVA, NO DE GOLPE!',
              tapsRequeridos: 5,
              exito: 'Frenaste de forma progresiva: en piso mojado, frenar de golpe puede hacerte perder el control.',
              fallo: 'Frenaste de golpe sobre piso mojado, aumentando el riesgo de patinar y caer.',
            },
            {
              id: 'motero-zigzag',
              categoria: 'normas',
              tipo: 'swipe-abajo',
              emoji: '🏍️↔️🚫',
              situacion: 'El tráfico está pesado y sientes la tentación de zigzaguear entre los carros para avanzar más rápido.',
              accionTexto: '⬇️ Desliza para mantenerte en un solo carril, sin zigzaguear',
              exito: 'Te mantuviste en tu carril: zigzaguear reduce el tiempo de reacción de los demás conductores frente a ti.',
              fallo: 'Zigzagueaste entre los carros, una de las causas más frecuentes de siniestros de motociclistas.',
            },
            {
              id: 'motero-casco-correcto',
              categoria: 'equipamiento',
              tipo: 'tap-repetido',
              emoji: '🪖✅',
              situacion: 'Antes de encender tu moto para tu primer recorrido, vas a ponerte el casco.',
              accionTexto: '¡AJUSTA BIEN LA CORREA Y VERIFICA SU CERTIFICACIÓN!',
              tapsRequeridos: 5,
              exito: 'Ajustaste correctamente tu casco: un casco certificado y bien ajustado es tu protección más importante.',
              fallo: 'Te subiste a la moto con el casco mal ajustado, perdiendo gran parte de su protección real.',
            },
          ],
        },
      },
      {
        tipo: 'trivia',
        config: {
          nombre: 'Reto 2: Sabiduría del motero',
          preguntas: [
            {
              id: 'motero-distancia-seguimiento',
              categoria: 'normas',
              emoji: '📏🏍️',
              texto: 'Vas conduciendo tu moto detrás de un carro en la vía.',
              pregunta: '¿Qué distancia de seguimiento es más segura mantener?',
              opciones: [
                'Una distancia amplia que te permita frenar o maniobrar a tiempo',
                'La más corta posible, para que no se metan otros carros',
                'No importa la distancia, solo la velocidad',
                'Pegado al vehículo de adelante para reducir el viento',
              ],
              correcta: 0,
              explicacion: 'Mantener una distancia amplia te da tiempo de reacción ante frenazos o maniobras inesperadas del vehículo de adelante.',
            },
            {
              id: 'motero-direccionales',
              categoria: 'normas',
              emoji: '🔄💡',
              texto: 'Vas a cambiar de carril en una vía con tráfico.',
              pregunta: '¿Qué debes hacer antes de cambiar de carril?',
              opciones: [
                'Activar el direccional con anticipación y verificar tus espejos y punto ciego',
                'Cambiar de carril rápido, sin avisar, para no perder el espacio',
                'Solo mirar hacia adelante, sin revisar los espejos',
                'Cambiar de carril y avisar con el direccional después',
              ],
              correcta: 0,
              explicacion: 'Activar el direccional con anticipación y verificar espejos y punto ciego le da tiempo a los demás conductores de reaccionar a tu maniobra.',
            },
            {
              id: 'motero-visibilidad-noche',
              categoria: 'equipamiento',
              emoji: '🌙🦺',
              texto: 'Vas a conducir tu moto de noche o con poca luz.',
              pregunta: '¿Qué te ayuda a que otros conductores te vean a tiempo?',
              opciones: [
                'Usar casco y chaqueta con elementos reflectivos, y mantener las luces en buen estado',
                'No es necesario hacer nada distinto de día',
                'Usar ropa oscura para no llamar la atención',
                'Apagar las luces para ahorrar batería',
              ],
              correcta: 0,
              explicacion: 'Los elementos reflectivos y las luces en buen estado aumentan significativamente la distancia a la que otros conductores te detectan.',
            },
            {
              id: 'motero-no-me-ve',
              categoria: 'atencion',
              emoji: '🚗❓🏍️',
              texto: 'Notas que un carro va a cambiar de carril hacia el espacio donde tú estás, como si no te hubiera visto.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Reducir velocidad, alejarte de su trayectoria y usar la bocina si es necesario',
                'Acelerar para pasar antes de que termine de cambiar de carril',
                'Quedarte en el mismo lugar esperando que te vea',
                'Hacerle reclamos con gestos mientras conduces',
              ],
              correcta: 0,
              explicacion: 'Cuando un conductor parece no haberte visto, lo más seguro es asumir que es así: reduce velocidad, aléjate de su trayectoria y usa la bocina para alertarlo si es necesario.',
            },
            {
              id: 'motero-velocidad-curvas',
              categoria: 'normas',
              emoji: '🛣️〜',
              texto: 'Te acercas a una curva en la carretera.',
              pregunta: '¿Cuándo debes reducir la velocidad?',
              opciones: [
                'Antes de entrar a la curva, no durante el giro',
                'Justo en la mitad de la curva',
                'No es necesario reducir velocidad en curvas',
                'Después de salir de la curva',
              ],
              correcta: 0,
              explicacion: 'Reducir la velocidad antes de entrar a la curva te permite mantener mejor control e inclinación durante el giro, en vez de frenar mientras ya estás girando.',
            },
            {
              id: 'motero-mantenimiento-preventivo',
              categoria: 'tumoto',
              emoji: '🔧🏍️',
              texto: 'Antes de salir a rodar, es buena práctica revisar el estado básico de tu moto.',
              pregunta: '¿Qué debes revisar antes de cada recorrido largo?',
              opciones: [
                'Presión de llantas, frenos, luces y nivel de aceite',
                'No es necesario revisar nada si la moto es nueva',
                'Solo el nivel de gasolina',
                'Solo revisarla una vez al año, sin importar el uso',
              ],
              correcta: 0,
              explicacion: 'Una moto en buen estado (llantas, frenos, luces, aceite) reduce drásticamente el riesgo de una falla mecánica que cause un siniestro en plena vía.',
            },
            {
              id: 'motero-respeto-peaton',
              categoria: 'respeto',
              emoji: '🚶🏍️❤️',
              texto: 'Te acercas a un cruce peatonal donde una persona está esperando para cruzar.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Ceder el paso al peatón y esperar a que cruce con seguridad',
                'Acelerar para pasar antes de que el peatón empiece a cruzar',
                'Tocar la bocina para que el peatón se aparte',
                'Pasar muy cerca del peatón para no perder tiempo',
              ],
              correcta: 0,
              explicacion: 'Ceder el paso a los peatones y compartir la vía con respeto hacia otros actores (peatones, ciclistas, otros conductores) es la base de una movilidad segura para todos.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
