window.MODULOS = window.MODULOS || {};

window.MODULOS['controladoresviales'] = {
  titulo: 'Controladores Viales',

  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ══════════════════════════════════════════════════════
      //  NIVEL 1 — Trivia: Fundamentos y Responsabilidad Legal
      // ══════════════════════════════════════════════════════
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 1: Fundamentos y Responsabilidad Legal',
          preguntas: [
            {
              id: 'cv1-responsabilidad',
              emoji: '⚖️🚧',
              texto: 'En una obra vial ocurre un accidente de tránsito porque no había señalización adecuada en el frente de trabajo.',
              pregunta: '¿Sobre quién recae la responsabilidad penal y civil?',
              opciones: [
                'Solo sobre el conductor que no supo esquivar la zona de obras',
                'Sobre quienes ejecutan la obra y sobre quienes la contrataron, solidariamente',
                'Solo sobre el municipio que autorizó la obra',
                'Solo sobre el supervisor de SST si tenía el cargo ese día',
              ],
              correcta: 1,
              explicacion: 'La ley es clara: quien ejecuta trabajos en vías públicas y quien los contrata son solidariamente responsables de garantizar la señalización. Un accidente por ausencia o mal estado de señales genera responsabilidad penal, civil y disciplinaria en ambos. No hay excusa válida.',
            },
            {
              id: 'cv1-requisitos-senal',
              emoji: '🪧✅',
              texto: 'Una señal de tránsito debe cumplir requisitos mínimos para lograr su objetivo de regular el tráfico de forma segura.',
              pregunta: '¿Cuáles son los requisitos que debe reunir TODA señal de tránsito?',
              opciones: [
                'Solo debe ser visible desde lejos; lo demás es secundario',
                'Debe ser necesaria, visible, legible y creíble, además de cumplir materiales y ubicación según norma',
                'Con que esté pintada de naranja y sea nueva es suficiente',
                'Solo importa que sea del tamaño correcto; el contenido puede variar',
              ],
              correcta: 1,
              explicacion: 'Toda señal debe ser NECESARIA (responder a un problema real), VISIBLE (a la distancia de reacción), LEGIBLE (tamaño y contraste correctos) y CREÍBLE (el conductor la obedece porque aplica al contexto). Una señal que no cumpla estos cuatro pilares falla en su misión de salvar vidas.',
            },
            {
              id: 'cv1-obligacion-instalacion',
              emoji: '🔨📋',
              texto: 'Según la legislación colombiana de tránsito y obras viales:',
              pregunta: '¿Quién está obligado a instalar y mantener la señalización en frentes de obra?',
              opciones: [
                'La Policía Nacional de Tránsito, en todos los casos',
                'Solo el Ministerio de Transporte, cuando la obra está en carreteras nacionales',
                'Quien ejecute trabajos en vías públicas, sin importar si es empresa privada, contratista o entidad oficial',
                'La compañía de seguros que ampara la obra',
              ],
              correcta: 2,
              explicacion: 'La obligación recae en quien ejecuta la intervención vial. Sin importar el tipo de obra ni si es pública o privada: el ejecutor instala, mantiene y retira la señalización. Esta obligación no se puede delegar ni ignorar.',
            },
            {
              id: 'cv1-senal-dia-noche',
              emoji: '🌞🌙🚧',
              texto: 'La normativa establece que la señalización de obra debe estar operativa en todo momento mientras exista la intervención.',
              pregunta: '¿En qué momentos del día debe mantenerse la señalización en una obra vial activa?',
              opciones: [
                'Solo durante el horario de trabajo de los obreros (7am–5pm)',
                'Solo de noche, cuando la visibilidad es baja',
                'Las 24 horas, incluyendo fines de semana y festivos, mientras la intervención exista',
                'Solo cuando haya trabajadores presentes en el frente de obra',
              ],
              correcta: 2,
              explicacion: 'El peligro existe mientras la obra exista, no solo mientras se trabaja. Una excavación sin señalizar a las 2am es igual de peligrosa que a las 10am. La señalización es permanente: 24 horas, 7 días, hasta que la vía esté completamente restaurada.',
            },
            {
              id: 'cv1-senal-creible',
              emoji: '🤔🪧',
              texto: 'En una vía hay 20 señales de "velocidad máxima 30 km/h" pero ninguna razón visible para limitar la velocidad. Los conductores las ignoran por completo.',
              pregunta: '¿Qué requisito fundamental están incumpliendo esas señales?',
              opciones: [
                'La visibilidad: están muy pequeñas',
                'La legibilidad: el texto es confuso',
                'La credibilidad: el conductor no ve la razón del límite y no la obedece',
                'La necesidad: son demasiado nuevas',
              ],
              correcta: 2,
              explicacion: 'Una señal que nadie obedece porque no parece justificada INCUMPLE el requisito de CREDIBILIDAD. Una señal de 30 km/h frente a un colegio en horario escolar es creíble y se obedece. La misma señal en una vía amplia sin razón aparente pierde credibilidad y efectividad. Cada señal debe tener razón de ser evidente.',
            },
            {
              id: 'cv1-elementos-prohibidos',
              emoji: '🚫📦',
              texto: 'Algunos contratistas improvisan señalización con piedras, llantas, ramas o materiales de obra para cerrar carriles.',
              pregunta: '¿Qué consecuencia tiene usar elementos NO autorizados por el Plan de Manejo de Tránsito (PMT) como señalización?',
              opciones: [
                'Ninguna, si el resultado es que los vehículos sí respetan el cierre',
                'Solo genera una multa menor al supervisor de obra',
                'Incumple el PMT y genera responsabilidad legal adicional si ocurre un accidente',
                'Es aceptable si es temporal (menos de 4 horas)',
              ],
              correcta: 2,
              explicacion: 'El PMT (Plan de Manejo de Tránsito) aprobado es el único instrumento legal que autoriza la señalización. Usar elementos no aprobados (llantas, piedras, ramas) incumple el PMT, invalida el seguro de obra y agrava la responsabilidad en caso de accidente. La improvisación en señalización no existe: o cumples el PMT o estás fuera de la ley.',
            },
            {
              id: 'cv1-objetivo-señalizacion',
              emoji: '🎯🛣️',
              texto: 'El sistema de señalización en obras viales tiene un objetivo principal que va más allá de cumplir un requisito legal.',
              pregunta: '¿Cuál es el objetivo central de la señalización en frentes de obra?',
              opciones: [
                'Evitar multas y sanciones para la empresa contratista',
                'Desviar el tráfico y reducir el paso de vehículos pesados',
                'Minimizar accidentes, proteger a usuarios de la vía y garantizar la seguridad de los trabajadores',
                'Hacer visible la obra para que los conductores sepan a quién reclamar daños',
              ],
              correcta: 2,
              explicacion: 'La señalización existe para SALVAR VIDAS: la de los trabajadores dentro de la obra y la de los usuarios de la vía. El cumplimiento legal es una consecuencia, no el fin. Un frente de obra bien señalizado es aquel en que ningún usuario llega sorprendido a la zona de riesgo.',
            },
            {
              id: 'cv1-pmt-definicion',
              emoji: '📄🗺️',
              texto: 'Antes de iniciar cualquier intervención en vía pública, el contratista debe elaborar y someter a aprobación un documento técnico obligatorio.',
              pregunta: '¿Cómo se llama este documento y para qué sirve?',
              opciones: [
                'Informe de impacto ambiental: para medir el daño ecológico de la obra',
                'Plan de Manejo de Tránsito (PMT): define la señalización, desvíos, zonas de control y responsables durante la intervención vial',
                'Permiso de ocupación de vía: solo indica el área de trabajo, sin detalles de señales',
                'Manual de convivencia vial: regula el comportamiento de los conductores, no de la obra',
              ],
              correcta: 1,
              explicacion: 'El PMT (Plan de Manejo de Tránsito) define EXACTAMENTE qué señales van, dónde, a qué distancia, qué desvíos se habilitan, cuántos controladores viales se necesitan y qué hacer en emergencias. Sin PMT aprobado, la obra no puede iniciar. Con PMT aprobado, el controlador tiene el respaldo legal y técnico de su trabajo.',
            },
          ],
        },
      },

      // ══════════════════════════════════════════════════════
      //  NIVEL 2 — Reacción: El PMT en Acción
      //  Toma de decisiones en situaciones reales de obra
      // ══════════════════════════════════════════════════════
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 2: El PMT (Plan de Manejo de Tránsito) en Acción',
          instrucciones: 'Las situaciones reales no esperan. Cada segundo en la vía es una decisión que protege vidas. ¡Reacciona correctamente!',
          retos: [
            {
              id: 'cv4-conductor-ignora-desvio',
              tipo: 'swipe-lateral',
              emoji: '🚗🚫↪️',
              situacion: 'Un vehículo ignora la señal de DESVÍO naranja del Plan de Manejo de Tránsito (PMT) y avanza directo hacia la zona de obras cerrada. Los trabajadores están excavando sin verlo venir.',
              accionTexto: '↔️ Desliza: levanta la paleta PARE frente al vehículo ahora',
              exito: 'Correcto. Paleta PARE extendida, firme, a nivel del hombro. Esta acción puede evitar una tragedia. Después repórtalo: un conductor que ignora señales del PMT es información valiosa para ajustar el plan y alertar a la autoridad de tránsito.',
              fallo: 'El vehículo entró a la zona de obras. Los conductores que ignoran desvíos son el mayor riesgo en frentes de obra. El controlador es la última línea de defensa: si el PARE no se activa a tiempo, la consecuencia puede ser fatal para los trabajadores.',
            },
            {
              id: 'cv4-peaton-zona-activa',
              tipo: 'swipe-abajo',
              emoji: '🚶‍♂️⚠️🚗',
              situacion: 'Un peatón cruza por el Área de Obras mientras tienes el SIGA activo para los vehículos. No hay paso peatonal en ese punto del Plan de Manejo de Tránsito (PMT). Los vehículos están cruzando a velocidad.',
              accionTexto: '⬇️ Desliza: cambia a PARE y guía al peatón al paso seguro habilitado',
              exito: 'Perfecto. PARE inmediato, guía al peatón al paso habilitado. Retoma el SIGA solo cuando el peatón esté seguro. El PMT siempre incluye un paso peatonal alternativo: parte de tu trabajo es conocerlo y hacerlo respetar.',
              fallo: 'Dejaste al peatón cruzar con tráfico activo. En zona de carril único provisional, los conductores no esperan peatones y tienen visibilidad limitada. Un atropello en zona de obra compromete legalmente al controlador, al supervisor y al contratista.',
            },
            {
              id: 'cv4-transporte-bloquea',
              tipo: 'tap-repetido',
              emoji: '🚌📻🚦',
              situacion: 'Un bus de transporte público quedó detenido bloqueando la vía del desvío definida en el Plan de Manejo de Tránsito (PMT). El tráfico se acumula y hay riesgo de que los conductores invadan la zona de obras.',
              accionTexto: '¡COORDINA POR RADIO! Reporta al supervisor. Toca para solicitar apoyo.',
              tapsRequeridos: 4,
              exito: 'Correcto. Reportas: "Desvío del PMT bloqueado por bus, tráfico acumulado, riesgo de invasión de obra". El supervisor coordina con tránsito o policía. Mantén el PARE activo mientras se resuelve. No improvises solo ante un bloqueo.',
              fallo: 'No reportaste y la situación empeoró. Los bloqueos del desvío del PMT son incidentes críticos que requieren gestión del supervisor o la autoridad de tránsito. Un controlador que intenta resolver solo un bloqueo de bus pierde al mismo tiempo el control del tráfico de la obra.',
            },
            {
              id: 'cv4-lluvia-intensa',
              tipo: 'swipe-abajo',
              emoji: '🌧️👁️🚧',
              situacion: 'Lluvia intensa reduce la visibilidad a menos de 30 metros. Los conductores no pueden ver la paleta ni las señales del Plan de Manejo de Tránsito (PMT) con claridad. La obra continúa con maquinaria activa.',
              accionTexto: '⬇️ Desliza: activa el protocolo de baja visibilidad y alerta al supervisor',
              exito: 'Bien. En baja visibilidad: solicita activar luces de emergencia en vallas, reduce el intervalo del SIGA para que haya menos vehículos cruzando a la vez, y alerta al jefe de obra para evaluar si las condiciones permiten continuar. La lluvia extrema puede obligar a pausar.',
              fallo: 'Continuaste como si el tiempo fuera normal. A 50 km/h con 30 metros de visibilidad, el conductor tiene menos de 2 segundos para ver y frenar. En baja visibilidad el controlador debe activar protocolos especiales o la obra debe pausar.',
            },
            {
              id: 'cv4-sin-reemplazo',
              tipo: 'swipe-lateral',
              emoji: '⏰🧍❌',
              situacion: 'Terminó tu turno pero el controlador del relevo no llegó. Los trabajadores siguen en la obra. Llevas 8 horas de pie. Te ofrecen continuar media hora más sin acuerdo previo.',
              accionTexto: '↔️ Desliza: reporta al supervisor — nunca abandones el puesto sin reemplazo confirmado',
              exito: 'Correcto. El puesto no puede quedar vacío. Reportas al supervisor: "No hay relevo, necesito refuerzo". El supervisor resuelve: llama al relevo, envía un suplente o pausa la obra. Continuar fatigado sin acuerdo es un riesgo real; abandonar sin reemplazo es peor.',
              fallo: 'Abandonaste el puesto. Un controlador que se va sin reemplazo deja a los trabajadores sin protección. Los siguientes 30 minutos, cualquier vehículo puede entrar sin control a la zona de obras. La fatiga del controlador es un riesgo real, pero la solución es el supervisor, nunca irse.',
            },
          ],
        },
      },

      // ══════════════════════════════════════════════════════
      //  NIVEL 3 — Trivia Ráfaga: Señales y Prelación Art. 111 CNT
      //  SP / SR / SI / ST — Colores, formas y jerarquía
      // ══════════════════════════════════════════════════════
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 3: Dominio de Señales — Clasificación Ráfaga',
          preguntas: [
            {
              id: 'cv2-prelacion-1',
              emoji: '👮‍♂️🥇',
              texto: 'El Artículo 111 del Código Nacional de Tránsito establece un orden de prelación entre las señales de tránsito.',
              pregunta: '¿Qué tipo de señal tiene la MÁXIMA prelación, superando incluso al semáforo?',
              opciones: [
                'El semáforo en verde',
                'Las señales verticales reglamentarias permanentes',
                'Las órdenes e indicaciones de los agentes de tránsito',
                'Las señales transitorias de obra (naranja)',
              ],
              correcta: 2,
              explicacion: 'Según el Art. 111 del CNT, el orden es: 1° Agentes de tránsito, 2° Señales transitorias, 3° Semáforos, 4° Señales verticales, 5° Marcas viales. El agente con su paleta o su orden verbal supera cualquier luz, señal o marca. Tú, como controlador vial autorizado, ejerces esta función en la zona de obra.',
            },
            {
              id: 'cv2-prelacion-transitoria',
              emoji: '🟠2️⃣',
              texto: 'Las señales transitorias de obra (naranja) tienen un lugar especial en la jerarquía del Art. 111 del Código Nacional de Tránsito.',
              pregunta: '¿En qué posición están las señales transitorias dentro del orden de prelación?',
              opciones: [
                '5° lugar — por debajo de todas las señales permanentes',
                '2° lugar — solo las superan los agentes de tránsito',
                '3° lugar — al mismo nivel que los semáforos',
                '1° lugar — superan incluso a los agentes de tránsito',
              ],
              correcta: 1,
              explicacion: 'Las señales transitorias (ST - naranja) ocupan el 2° lugar de prelación, superadas solo por los agentes de tránsito. Una señal de desvío temporal de obra (naranja) puede contradecir una señal permanente blanca o azul, y el conductor DEBE obedecer la naranja. La zona de obra temporalmente cambia las reglas de la vía.',
            },
            {
              id: 'cv2-tipo-sp',
              emoji: '⚠️🟡',
              texto: 'Las señales SP son las Señales Preventivas. Advierten al conductor de condiciones o peligros próximos que exigen precaución.',
              pregunta: '¿Cómo se identifican las señales SP por su forma y color?',
              opciones: [
                'Círculo rojo con borde blanco',
                'Rectángulo azul',
                'Rombo (diamante) amarillo con símbolo negro',
                'Octágono rojo con texto blanco',
              ],
              correcta: 2,
              explicacion: 'SP = Señal Preventiva. Forma: diamante (rombo). Color: fondo amarillo, símbolo negro. En zona de obra: "SP-52 Hombres trabajando", "SP-53 Maquinaria trabajando". Son las primeras que el conductor ve al acercarse: lo preparan para reducir velocidad y aumentar atención.',
            },
            {
              id: 'cv2-tipo-sr',
              emoji: '🔴⛔',
              texto: 'Las señales SR son las Señales Reglamentarias — regulan el comportamiento del conductor de manera obligatoria.',
              pregunta: '¿Cuál es la forma y color característicos de las señales SR?',
              opciones: [
                'Diamante amarillo con símbolo negro',
                'Rectángulo verde con letras blancas',
                'Círculo con borde rojo (o rojo con texto/símbolo en negro y blanco)',
                'Octágono naranja con texto negro',
              ],
              correcta: 2,
              explicacion: 'SR = Señal Reglamentaria. Fondo blanco, borde rojo. Ejemplo: SR-01 (PARE) = octágono rojo con "PARE" blanco. SR-30 (velocidad máxima) = círculo blanco con borde rojo y número negro. Desobedecer una señal SR es una infracción de tránsito.',
            },
            {
              id: 'cv2-tipo-si',
              emoji: '🔵ℹ️',
              texto: 'Las señales SI son las Señales Informativas — orientan e informan al usuario sobre rutas, distancias y servicios.',
              pregunta: '¿Cuál es la forma y color de las señales SI?',
              opciones: [
                'Triángulo rojo',
                'Rombo amarillo con texto negro',
                'Rectángulo azul o verde con texto/símbolos blancos',
                'Círculo con borde rojo',
              ],
              correcta: 2,
              explicacion: 'SI = Señal Informativa. Rectángulo azul (servicios e información general) o verde (rutas y distancias). En zona de obra se usan señales de DESVÍO con fondo naranja y flecha, que dirigen al conductor por la ruta alterna. Las señales de desvío son esenciales para que el Plan de Manejo de Tránsito (PMT) funcione correctamente.',
            },
            {
              id: 'cv2-tipo-st',
              emoji: '🟠🚧',
              texto: 'Las señales ST son las Señales Transitorias — exclusivas para zonas de obra o eventos especiales. Son temporales y tienen alta prelación.',
              pregunta: '¿Cuál es el color de fondo que identifica TODAS las señales transitorias ST de obra?',
              opciones: [
                'Amarillo fluorescente',
                'Rojo',
                'Naranja',
                'Blanco con borde negro',
              ],
              correcta: 2,
              explicacion: 'NARANJA es el color exclusivo de las señales transitorias ST. Todo en la zona de obra que sea temporal lleva naranja: conos, cintas, vallas, señales de prevención y reglamentarias de obra. El naranja le dice al conductor: "esto es temporal, sigue estas señales aunque contradigan las permanentes que conoces".',
            },
            {
              id: 'cv2-vertical-vs-horizontal',
              emoji: '⬆️↔️',
              texto: 'En algunos puntos de la vía, las señales verticales y las marcas viales horizontales pueden dar indicaciones que parecen contradictorias.',
              pregunta: '¿Cuál tiene mayor prelación según el Art. 111 del Código Nacional de Tránsito?',
              opciones: [
                'Las marcas horizontales (pintadas en el suelo): están más cerca del conductor',
                'Las señales verticales (en poste o valla): están por encima de las marcas en el orden de prelación',
                'Depende: la más nueva siempre supera a la más antigua',
                'Las dos tienen la misma prelación; el conductor elige',
              ],
              correcta: 1,
              explicacion: 'Las señales verticales tienen mayor prelación que las marcas viales horizontales. Si una marca de carril contradice una señal vertical de dirección obligatoria, obedece la señal vertical. En zona de obra esto es crítico: las señales verticales naranjas mandan sobre las líneas del piso aunque no hayan sido borradas aún.',
            },
            {
              id: 'cv2-pee-señal',
              emoji: '🩷💎',
              texto: 'Las señales PEE son una categoría especial del sistema de señalización colombiano, usadas en eventos deportivos, festivales y cierres temporales especiales.',
              pregunta: '¿Cuál es la forma y color ÚNICO de las señales PEE?',
              opciones: [
                'Triángulo rojo, igual que las señales de peligro europeas',
                'Diamante (rombo) rosado fluorescente',
                'Rectángulo azul con texto blanco, igual que las SI',
                'Círculo naranja con borde negro',
              ],
              correcta: 1,
              explicacion: 'PEE = Señal para Eventos Especiales. Forma: diamante (rombo). Color: rosado fluorescente. Son exclusivas para eventos de alto impacto al tráfico: maratones, festivales, desfiles. No se usan en obras viales regulares. Si ves rosado en la vía, hay un evento especial cercano.',
            },
          ],
        },
      },

      // ══════════════════════════════════════════════════════
      //  NIVEL 4 — Obstáculos: Operación Segura + Factor Humano
      //  Recuerda: alguien te espera en casa.
      // ══════════════════════════════════════════════════════
      {
        tipo: 'obstaculos',
        opcional: true,
        config: {
          nombre: 'Nivel 4: Operación Segura — El Factor Humano',
          instrucciones: '¡Mantén la zona segura! Toca cada amenaza antes de que llegue a los trabajadores. Recuerda: alguien te espera en casa. 🏠',
          total: 20,
          intervalo: 950,
          duracionCaida: 2400,
          tipos: ['😡', '🚗', '🌧️', '📵', '🚶', '🌙', '⚠️', '😴', '😡', '🚗', '🌧️', '🌙', '⚠️', '🚶', '😡', '📵', '🚗', '😴', '🌧️', '😡'],
          particulas: {
            '😡': '🛑',
            '🚗': '✋',
            '🌧️': '🦺',
            '📵': '🏃',
            '🚶': '👉',
            '🌙': '🔦',
            '⚠️': '🔧',
            '😴': '📢',
            default: '✨',
          },
        },
      },

      // ══════════════════════════════════════════════════════
      //  NIVEL 5 — Trivia: Las 5 Zonas Críticas de la Obra
      //  Prevención → Transición → Seguridad → Obras → Fin
      // ══════════════════════════════════════════════════════
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 5: Geometría de la Obra — Las 5 Zonas Críticas',
          preguntas: [
            {
              id: 'cv3-zona-prevencion',
              emoji: '⚠️🛣️',
              texto: 'Al acercarse a una obra vial, los vehículos pasan primero por una zona que los ADVIERTE de la situación que encontrarán más adelante.',
              pregunta: '¿Cómo se llama esta primera zona y cuál es su función?',
              opciones: [
                'Zona de Obras: donde están los trabajadores y la maquinaria activa',
                'Zona de Prevención: advierte a los usuarios con señales SP-naranjas que hay una obra adelante y que deben reducir velocidad',
                'Zona de Transición: desplaza el tráfico del carril afectado',
                'Zona de Fin de Obras: indica que la obra terminó',
              ],
              correcta: 1,
              explicacion: 'La Zona de Prevención es la primera que encuentra el conductor. Se instalan señales SP naranjas: "Hombres trabajando", "Maquinaria en vía", "Velocidad máxima reducida". Su objetivo: que el conductor SEPA con anticipación que hay obra adelante y ajuste velocidad y atención ANTES de llegar al área de riesgo.',
            },
            {
              id: 'cv3-zona-transicion',
              emoji: '↩️🔀',
              texto: 'Después de la Zona de Prevención, los vehículos deben abandonar el carril que ocupa la obra y moverse al carril habilitado.',
              pregunta: '¿Cómo se llama esta zona y qué elementos la componen?',
              opciones: [
                'Zona de Seguridad: donde los trabajadores protegen sus equipos',
                'Zona de Fin de Obras: señala el retorno a condiciones normales',
                'Zona de Transición: guía el desplazamiento lateral con conos, delineadores o canecas en fila diagonal',
                'Área de Obras: donde se hace el trabajo pesado',
              ],
              correcta: 2,
              explicacion: 'La Zona de Transición desplaza lateralmente el tráfico. Se forma con conos o canecas en fila diagonal. Los vehículos ABANDONAN el carril de la obra y se integran al carril activo. A mayor velocidad permitida, mayor debe ser la longitud de la zona de transición.',
            },
            {
              id: 'cv3-zona-seguridad',
              emoji: '🛡️🚫',
              texto: 'Existe una zona buffer entre donde termina el tráfico activo y donde empieza realmente el trabajo de la obra.',
              pregunta: '¿Cómo se llama esta zona y qué la caracteriza?',
              opciones: [
                'Zona de Prevención: la primera que ve el conductor al acercarse',
                'Zona de Transición: donde los conductores cambian de carril',
                'Área de Seguridad: espacio buffer reservado SOLO para la obra; ningún vehículo del tráfico puede ingresar; NO hay materiales ni excavaciones aquí',
                'Zona de Fin de Obras: espacio para retomar velocidad normal',
              ],
              correcta: 2,
              explicacion: 'El Área de Seguridad es el colchón entre el tráfico activo y los trabajadores. Aquí NO hay materiales sueltos, vehículos estacionados ni excavaciones. Es el espacio que salva la vida del trabajador si un vehículo invade la zona por error. Sus dimensiones mínimas están definidas en el Plan de Manejo de Tránsito (PMT) según la velocidad de la vía.',
            },
            {
              id: 'cv3-area-obras',
              emoji: '👷🏗️',
              texto: 'Dentro de la geometría de la obra vial, hay una zona donde ocurre el trabajo real: excavaciones, instalaciones, pavimentación.',
              pregunta: '¿Cómo se llama esta zona y quiénes pueden estar en ella?',
              opciones: [
                'Zona de Prevención: donde se instalan las señales de aviso',
                'Área de Obras: solo trabajan los operarios y maquinaria autorizada del proyecto; los vehículos del tráfico público no tienen acceso',
                'Zona de Transición: donde el tráfico cambia de carril',
                'Zona de Seguridad: espacio buffer entre tráfico y obra',
              ],
              correcta: 1,
              explicacion: 'El Área de Obras es el corazón de la intervención. Aquí operan trabajadores, maquinaria y equipos del proyecto. Ningún vehículo de tráfico público debe ingresar. La separación entre el Área de Obras y el tráfico activo es responsabilidad del controlador vial: su trabajo asegura que esta frontera nunca se cruce.',
            },
            {
              id: 'cv3-fin-obras',
              emoji: '🏁✅',
              texto: 'Después del área de trabajo, los conductores necesitan saber que salieron de la zona de riesgo y pueden retomar las condiciones normales de circulación.',
              pregunta: '¿Cómo se llama esta última zona y qué señal la identifica?',
              opciones: [
                'Zona de Prevención: con señales SP de aviso',
                'Zona de Transición: con conos en diagonal',
                'Zona de Fin de Obras: señalizada con la señal transitoria "FIN DE ZONA DE OBRA" (naranja); el tráfico recupera sus condiciones normales',
                'Área de Seguridad: zona buffer sin vehículos',
              ],
              correcta: 2,
              explicacion: 'La Zona de Fin de Obras le dice al conductor "ya saliste". Aquí se ubica la señal ST "FIN DE ZONA DE OBRA" y se retiran las restricciones de velocidad. Sin esta zona, los conductores no saben cuándo terminó la restricción y el caos continúa más allá de la obra.',
            },
            {
              id: 'cv3-orden-zonas',
              emoji: '1️⃣2️⃣3️⃣4️⃣5️⃣',
              texto: 'Las 5 zonas de una obra vial tienen un orden lógico en el sentido de circulación, desde el primer aviso hasta la normalización del tráfico.',
              pregunta: '¿Cuál es el orden CORRECTO de las zonas?',
              opciones: [
                'Obras → Seguridad → Transición → Prevención → Fin de Obras',
                'Prevención → Transición → Seguridad → Obras → Fin de Obras',
                'Transición → Prevención → Obras → Seguridad → Fin de Obras',
                'Seguridad → Prevención → Transición → Fin de Obras → Obras',
              ],
              correcta: 1,
              explicacion: 'El orden correcto es: 1° Prevención → 2° Transición → 3° Seguridad → 4° Obras → 5° Fin de Obras. Esta secuencia garantiza que el conductor sea preparado gradualmente antes de llegar al área de riesgo, y que sepa con certeza cuándo sale de la zona controlada.',
            },
            {
              id: 'cv3-controlador-ubicacion',
              emoji: '🧍‍♂️📍',
              texto: 'El controlador vial tiene una ubicación específica dentro de la geometría de las 5 zonas de la obra.',
              pregunta: '¿En qué zona y punto se ubica el controlador vial?',
              opciones: [
                'Dentro del Área de Obras, para ver mejor lo que pasa con la maquinaria',
                'En el límite entre la Zona de Prevención y la Zona de Transición',
                'Al inicio de la Zona de Transición o en el punto de control de carril único, fuera de la línea de fuego',
                'En la Zona de Fin de Obras, para indicar a los conductores que ya pueden acelerar',
              ],
              correcta: 2,
              explicacion: 'El controlador se ubica en el punto de control, al inicio de la Zona de Transición o donde se establece el paso alternado de carril único. Desde ahí tiene visibilidad del tráfico que se aproxima y puede dar el PARE o SIGA a tiempo. No dentro de la obra (riesgo de maquinaria) ni tan lejos que los conductores estén ya en la transición cuando lo ven.',
            },
            {
              id: 'cv3-señal-desvio',
              emoji: '↪️🟠',
              texto: 'Cuando una obra obliga a los vehículos a tomar una ruta alternativa, se debe señalizar cada punto de decisión del desvío.',
              pregunta: '¿Qué tipo de señal se usa para indicar un desvío en zona de obra y qué color tiene?',
              opciones: [
                'Señal SR permanente blanca con flecha negra: son las más visibles',
                'Señal verde del INVIAS: indica rutas nacionales',
                'Señal de desvío transitoria naranja con flecha: categoría ST, igual que las demás señales de obra',
                'Cono con cinta amarilla: no se necesita señal formal para desvíos cortos',
              ],
              correcta: 2,
              explicacion: 'Los desvíos de obra se señalizan con señales transitorias ST naranjas con flechas y texto de dirección. No se mezclan con señalización verde permanente ni se improvisan con cintas. Un desvío bien señalizado evita que los conductores se pierdan, generen más congestión o regresen a la zona de obra.',
            },
          ],
        },
      },

    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
