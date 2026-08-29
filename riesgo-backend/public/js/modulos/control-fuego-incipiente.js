window.MODULOS = window.MODULOS || {};

window.MODULOS['controldefuegoincipiente'] = {
  titulo: 'Control de Fuego Incipiente',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      // ── Sub-nivel 1: Tetraedro del fuego y clases ──
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel 1: El Fuego y sus Clases',
          preguntas: [
            {
              id: 'fuego-tetraedro-cuatro-elementos',
              emoji: '🔥🔺',
              texto: 'El fuego no ocurre por sí solo: necesita que se junten cuatro factores al mismo tiempo.',
              pregunta: '¿Cuáles son los cuatro componentes del Tetraedro del Fuego?',
              opciones: [
                'Oxígeno, combustible, calor y reacción química en cadena',
                'Agua, viento, tierra y fuego',
                'Chispa, material, humo y temperatura',
                'Presión, gas, oxígeno y llama',
              ],
              correcta: 0,
              explicacion: 'El Tetraedro del Fuego tiene cuatro lados: oxígeno (comburente), combustible (material que arde), calor (fuente de ignición) y reacción química en cadena. Eliminar cualquiera de los cuatro extingue el fuego.',
            },
            {
              id: 'fuego-clase-a-solidos',
              emoji: '🔥📦',
              texto: 'En una bodega hay cajas de cartón, madera y tela que comienzan a arder.',
              pregunta: '¿A qué clase de fuego corresponde?',
              opciones: [
                'Clase A: materiales sólidos comunes como madera, cartón, papel y tela',
                'Clase B: líquidos inflamables',
                'Clase C: equipos eléctricos',
                'Clase K: aceites de cocina',
              ],
              correcta: 0,
              explicacion: 'El fuego Clase A involucra sólidos comunes: madera, papel, cartón, tela y plásticos. Se puede controlar con agua, polvo ABC, agente limpio o Watermist.',
            },
            {
              id: 'fuego-clase-b-liquidos',
              emoji: '🔥⛽',
              texto: 'Se derrama gasolina y se incendia.',
              pregunta: '¿A qué clase de fuego corresponde y por qué no se debe usar agua?',
              opciones: [
                'Clase B: líquidos inflamables. El agua los dispersa y propaga el incendio',
                'Clase A: sólidos. El agua siempre es la mejor opción',
                'Clase C: eléctrico. Solo los bomberos pueden actuar',
                'Clase D: metales. Se necesita arena',
              ],
              correcta: 0,
              explicacion: 'El fuego Clase B involucra líquidos y gases inflamables. El agua puede dispersar el líquido en llamas y propagar el incendio en lugar de controlarlo. Se debe usar CO₂, PQS-ABC o agente limpio.',
            },
            {
              id: 'fuego-clase-c-electrico',
              emoji: '🔥⚡',
              texto: 'Un tablero eléctrico empieza a arder mientras está energizado.',
              pregunta: '¿Qué está completamente prohibido usar en este fuego Clase C?',
              opciones: [
                'Agua: conduce electricidad y puede provocar una descarga letal',
                'CO₂: no es apto para equipos eléctricos',
                'Polvo químico seco ABC: solo sirve para madera',
                'Agente limpio: no aplica a fuegos eléctricos',
              ],
              correcta: 0,
              explicacion: 'En fuegos Clase C (equipos eléctricos energizados) jamás se debe usar agua porque conduce electricidad. Se usan CO₂, PQS-ABC o agente limpio, y si es posible se corta la energía primero.',
            },
            {
              id: 'fuego-clase-k-cocina',
              emoji: '🔥🍳',
              texto: 'El aceite de una freidora industrial se incendia.',
              pregunta: '¿Qué tipo de extintor está diseñado específicamente para este tipo de fuego?',
              opciones: [
                'Extintor Clase K, formulado para aceites vegetales y animales de cocina',
                'Extintor de agua a presión',
                'Extintor de CO₂ estándar',
                'Cualquier extintor ABC multipropósito',
              ],
              correcta: 0,
              explicacion: 'El fuego Clase K ocurre con aceites de cocina (vegetales y animales) en freidoras y cocinas industriales. Requiere un extintor específico Clase K que usa acetato de potasio; el agua u otros agentes pueden provocar una explosión de vapor.',
            },
            {
              id: 'fuego-clase-l-litio',
              emoji: '🔥🔋',
              texto: 'La batería de ión-litio de un vehículo eléctrico empieza a arder con mucho calor.',
              pregunta: '¿Qué clase de fuego es y qué lo hace diferente a los demás?',
              opciones: [
                'Clase L (nueva ISO 3941:2026): genera su propio oxígeno y requiere extintor especial',
                'Clase B: se apaga con CO₂ estándar como cualquier líquido',
                'Clase A: se puede apagar con agua abundante sin riesgo',
                'Clase C: solo hay que cortar la corriente eléctrica',
              ],
              correcta: 0,
              explicacion: 'La nueva Clase L (ISO 3941:2026) cubre baterías de ión-litio. Estas baterías pueden generar su propio oxígeno durante la combustión (thermal runaway), haciendo ineficaces los métodos convencionales. Requieren extintores especiales.',
            },
          ],
        },
      },

      // ── Sub-nivel 2: Reacciones ante el fuego ──
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Sub-nivel 2: ¡Reacciona al Fuego!',
          instrucciones: 'Lee la situación y reacciona a tiempo con el gesto correcto.',
          retos: [
            {
              id: 'fuego-reaccion-alarma-primero',
              tipo: 'tap-repetido',
              emoji: '🔔🔥',
              situacion: 'Ves un pequeño inicio de fuego en un archivador. Tienes un extintor cerca.',
              accionTexto: '¡ACTIVA LA ALARMA ANTES DE TOMAR EL EXTINTOR!',
              tapsRequeridos: 5,
              exito: '¡Correcto! Avisar primero garantiza que otros evacúen y pidan ayuda mientras tú intentas controlar el fuego.',
              fallo: 'Tomaste el extintor sin avisar. Si el fuego crece rápido, nadie sabe que estás en peligro.',
            },
            {
              id: 'fuego-reaccion-apuntar-base',
              tipo: 'swipe-abajo',
              emoji: '🧯⬇️🔥',
              situacion: 'Extintor en mano, fuego pequeño frente a ti. El método PASE indica apuntar a la BASE, no a las llamas.',
              accionTexto: '⬇️ Desliza hacia abajo para apuntar a la BASE del fuego',
              exito: '¡Así es! Atacar la base elimina el combustible, no las llamas visibles que son solo la consecuencia.',
              fallo: 'Apuntaste a las llamas. Las llamas son el efecto, la base es donde está el combustible real.',
            },
            {
              id: 'fuego-reaccion-evacuar-humo-denso',
              tipo: 'swipe-lateral',
              emoji: '💨🏃‍♂️',
              situacion: 'El fuego creció y hay humo denso. Ya no puedes controlarlo con el extintor.',
              accionTexto: '↔️ Desliza: abandona el intento y evacúa de inmediato',
              exito: 'Evacuaste a tiempo. Ningún bien material justifica arriesgar tu vida cuando el fuego supera tu capacidad de control.',
              fallo: 'Seguiste intentando apagar. Con humo denso, pierdes visibilidad y oxígeno en segundos.',
            },
          ],
        },
      },

      // ── Sub-nivel 3: Tipos de extintor y selección ──
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel 3: Extintores — Selección y Uso',
          preguntas: [
            {
              id: 'fuego-extintor-abc-multiproposito',
              emoji: '🧯🅰️🅱️©️',
              texto: 'El extintor de tu oficina tiene marcado "PQS-ABC".',
              pregunta: '¿Para qué clases de fuego sirve?',
              opciones: [
                'Fuegos Clase A (sólidos), B (líquidos) y C (eléctrico): es multipropósito',
                'Solo para fuegos de materiales sólidos Clase A',
                'Solo para fuegos eléctricos Clase C',
                'Para todas las clases incluyendo D y K',
              ],
              correcta: 0,
              explicacion: 'El polvo químico seco (PQS) tipo ABC es el extintor más común en oficinas: sirve para fuegos de sólidos, líquidos inflamables y equipos eléctricos. No es apropiado para metales (Clase D) ni aceites de cocina (Clase K).',
            },
            {
              id: 'fuego-extintor-co2-caracteristica',
              emoji: '🧯❄️',
              texto: 'Usas un extintor de CO₂ en un fuego de equipo eléctrico. No deja residuos.',
              pregunta: '¿Cuál es la principal ventaja del CO₂ en equipos electrónicos?',
              opciones: [
                'No deja residuos ni conduce electricidad, ideal para equipos delicados',
                'Es el más económico de todos los extintores',
                'Sirve para cualquier clase de fuego sin excepción',
                'Es el único extintor que funciona en espacios cerrados sin ventilación',
              ],
              correcta: 0,
              explicacion: 'El CO₂ se evapora sin dejar residuos, lo que protege los equipos electrónicos delicados. Además, no conduce electricidad. Su desventaja: en espacios muy cerrados puede reducir el oxígeno disponible.',
            },
            {
              id: 'fuego-extintor-pase-pasos',
              emoji: '🧯📋',
              texto: 'Vas a usar un extintor por primera vez. El método PASE resume los pasos correctos.',
              pregunta: '¿Qué significa PASE?',
              opciones: [
                'P: Halar el seguro · A: Apuntar a la base · S: Apretar la palanca · E: Barrer de lado a lado',
                'P: Pedir ayuda · A: Alejarse · S: Salir · E: Esperar bomberos',
                'P: Presionar el cilindro · A: Abrir la válvula · S: Soplar las llamas · E: Esquivar el humo',
                'P: Protegerse · A: Atacar las llamas · S: Seguir adelante · E: Evacuar después',
              ],
              correcta: 0,
              explicacion: 'PASE: Pull (halar el seguro), Aim (apuntar a la base), Squeeze (apretar la palanca), Sweep (barrer de lado a lado). Es la técnica estándar internacional para uso de extintores portátiles.',
            },
            {
              id: 'fuego-extintor-30-segundos',
              emoji: '⏱️🔥',
              texto: 'Llevas 35 segundos intentando apagar el fuego con el extintor y no cede.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Detener el intento y evacuar de inmediato: si en 30 segundos no lo controlas, es momento de salir',
                'Buscar otro extintor y seguir intentando sin parar',
                'Acercarte más al fuego para que el agente sea más efectivo',
                'Pedir a un compañero que te releve y continúe la labor',
              ],
              correcta: 0,
              explicacion: 'Si el fuego no cede en 30 segundos de uso correcto del extintor, la situación ya superó la capacidad de control con medios portátiles. La prioridad es evacuar de inmediato y dejar actuar a los bomberos.',
            },
            {
              id: 'fuego-extintor-distancia-segura',
              emoji: '↔️🧯',
              texto: 'Para usar el extintor, debes mantenerte a una distancia segura del fuego.',
              pregunta: '¿Cuál es la posición correcta al acercarte?',
              opciones: [
                'De espaldas al viento, a 2–3 metros, con la ruta de escape despejada detrás de ti',
                'Lo más cerca posible del fuego para mayor efectividad',
                'De frente al viento para que el agente llegue más lejos',
                'Con la ruta de escape bloqueada por el fuego no importa, lo principal es apagarlo',
              ],
              correcta: 0,
              explicacion: 'Posicionarse de espaldas al viento evita que el humo y el agente extintor te afecten. Mantener la ruta de escape libre es fundamental para poder retirarte rápidamente si el fuego escala.',
            },
          ],
        },
      },

      // ── Sub-nivel 4: Inspección y mantenimiento NTC 2885 ──
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel 4: Inspección y Prevención — NTC 2885',
          preguntas: [
            {
              id: 'fuego-inspeccion-frecuencia',
              emoji: '📋🗓️',
              texto: 'La norma colombiana NTC 2885 establece con qué frecuencia mínima se deben inspeccionar los extintores portátiles.',
              pregunta: '¿Cada cuánto se debe hacer la inspección visual de los extintores?',
              opciones: [
                'Mensualmente: es la frecuencia mínima establecida por la NTC 2885',
                'Solo una vez al año, cuando los revisa el técnico',
                'Cada semana, para máxima seguridad',
                'Solo cuando se vea que el extintor está dañado',
              ],
              correcta: 0,
              explicacion: 'La NTC 2885 exige inspección visual mensual de los extintores. Esto permite detectar a tiempo problemas como baja presión, daños físicos o accesos bloqueados antes de que ocurra una emergencia.',
            },
            {
              id: 'fuego-inspeccion-manometro',
              emoji: '🔍⏱️',
              texto: 'Durante la inspección mensual, revisas el manómetro de un extintor y la aguja apunta a la zona roja.',
              pregunta: '¿Qué indica eso y qué debes hacer?',
              opciones: [
                'Indica que la presión es incorrecta: el extintor debe retirarse de servicio y enviarse a mantenimiento',
                'La zona roja significa que el extintor tiene presión máxima y está perfecto',
                'Es normal y no requiere ninguna acción',
                'Solo debes anotar la observación pero dejarlo en su lugar',
              ],
              correcta: 0,
              explicacion: 'En un extintor en buen estado, la aguja del manómetro debe estar en la zona verde (presión nominal). Si apunta a rojo (alta o baja presión), el extintor no funcionará correctamente y debe retirarse y enviarse a mantenimiento de inmediato.',
            },
            {
              id: 'fuego-inspeccion-acceso-libre',
              emoji: '🚫📦🧯',
              texto: 'Notas que hay varias cajas apiladas delante de un extintor en la bodega.',
              pregunta: '¿Por qué es un problema y qué debes hacer?',
              opciones: [
                'Obstaculiza el acceso: retirar las cajas de inmediato y reportar para que no vuelva a ocurrir',
                'No importa siempre que el extintor siga visible por arriba de las cajas',
                'Solo es un problema si las cajas son de material inflamable',
                'Se puede resolver en el momento de la emergencia retirando las cajas rápidamente',
              ],
              correcta: 0,
              explicacion: 'En una emergencia, cada segundo cuenta. Un extintor con el acceso bloqueado puede ser imposible de alcanzar a tiempo. Los extintores siempre deben estar despejados, visibles y accesibles sin obstáculos.',
            },
            {
              id: 'fuego-prevencion-orden-aseo',
              emoji: '🧹🔥',
              texto: 'La principal causa de incendios en lugares de trabajo es la acumulación de materiales innecesarios.',
              pregunta: '¿Cuál es la mejor práctica diaria para prevenir incendios?',
              opciones: [
                'Mantener el orden y el aseo, eliminando materiales inflamables acumulados innecesariamente',
                'Tener más extintores que el mínimo requerido es suficiente',
                'Solo se necesita tener un detector de humo encendido',
                'La prevención es responsabilidad exclusiva del área de SST',
              ],
              correcta: 0,
              explicacion: 'El orden y el aseo diarios son la primera línea de prevención de incendios. Eliminar materiales inflamables acumulados (papel, trapos, cajas) reduce drásticamente la carga de combustible disponible si ocurre un inicio de fuego.',
            },
            {
              id: 'fuego-etapas-fuego-incipiente',
              emoji: '🔥📈',
              texto: 'Un fuego incipiente es el que está en sus primeras etapas y aún puede ser controlado con medios portátiles.',
              pregunta: '¿Cuál es la "ventana" para actuar con un extintor de manera efectiva?',
              opciones: [
                'Los primeros 30 segundos desde que se inicia el fuego, antes de que se propague',
                'Cualquier momento, el extintor siempre es efectivo sin importar el tamaño del fuego',
                'Solo es posible actuar cuando los bomberos ya no pueden llegar',
                'Cuando el fuego ya lleva más de 5 minutos ardiendo',
              ],
              correcta: 0,
              explicacion: 'Un fuego incipiente puede controlarse en sus primeras etapas. La ventana de actuación efectiva con un extintor portátil es muy corta (aproximadamente los primeros 30 segundos). Pasado ese punto, si no cede, la prioridad es evacuar.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
