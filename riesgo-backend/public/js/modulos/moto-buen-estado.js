window.MODULOS['motoenbuenestado'] = {
  titulo: 'Moto en Buen Estado',
  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ── NIVEL 1: Inspección pre-ruta ──────────────────────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 1: Inspección pre-ruta',
          instrucciones: 'Desliza ✅ si debes continuar o ❌ si debes corregirlo antes de salir.',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '🔴',
              situacion: 'La llanta trasera se ve baja de presión. Tienes que llegar a tiempo a un compromiso.',
              accionTexto: '¿Sales con la llanta así?',
              exito: 'Correcto. Una llanta baja reduce la estabilidad, aumenta el riesgo de desinflado y alarga la distancia de frenado. Inflar antes de salir toma 5 minutos — una caída, meses.',
              fallo: 'Una llanta baja puede reventar en la vía. El control se pierde en fracciones de segundo. Infla antes de arrancar.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '💡',
              situacion: 'Al hacer la revisión, la luz delantera no enciende.',
              accionTexto: '¿Esperas a repararla antes de salir?',
              exito: 'Exacto. De noche o en túneles, sin luz delantera eres invisible para los demás. Es una infracción y un peligro mortal.',
              fallo: 'Sin luz delantera eres invisible de noche y en zonas de penumbra. Además, es una infracción que puede costarte la moto.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '😖',
              situacion: 'Al frenar escuchas un ruido metálico raro. Las pastillas pueden estar desgastadas.',
              accionTexto: '¿Revisas los frenos antes de la ruta larga?',
              exito: 'Perfecto. Los frenos desgastados aumentan exponencialmente la distancia de frenado. Un ruido metálico al frenar es una alarma que no puedes ignorar.',
              fallo: 'Un ruido metálico al frenar significa pastillas al límite o disco dañado. Seguir así puede dejarte sin frenos cuando más los necesitas.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🔗',
              situacion: 'La cadena está sucia, seca y con eslabones rígidos. Tienes una ruta larga.',
              accionTexto: '¿La limpias y lubricás antes de salir?',
              exito: 'Bien. Una cadena seca puede romperse en la vía y bloquear la rueda trasera instantáneamente. La lubricación es mantenimiento básico.',
              fallo: 'Una cadena seca y rígida puede partirse en plena vía. Si se enreda en la rueda trasera, la moto se detiene bruscamente sin previo aviso.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🪞',
              situacion: 'Los espejos están mal ajustados y uno está roto. Solo puedes ver una franja pequeña.',
              accionTexto: '¿Sales sin corregirlos?',
              exito: 'Correcto. Sin retrovisores adecuados pierdes hasta el 70% de tu zona de visión trasera. Los vehículos detrás se vuelven invisibles.',
              fallo: 'Los retrovisores deficientes crean puntos ciegos que no puedes ver. Un vehículo en tu punto ciego puede alcanzarte antes de que lo detectes.',
            },
          ],
        },
      },

      // ── NIVEL 2: Tecnología que salva ─────────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 2: Tecnología que salva',
          preguntas: [
            {
              emoji: '🛞',
              pregunta: '¿Qué hace el sistema CBS (Combined Braking System) en una moto?',
              opciones: [
                'Aumenta la potencia del motor en frenadas',
                'Distribuye automáticamente la fuerza de frenado entre rueda delantera y trasera',
                'Bloquea ambas ruedas para frenar más rápido',
                'Solo funciona combinado con ABS',
              ],
              correcta: 1,
              explicacion: 'El CBS (freno combinado) aplica fuerza a ambas ruedas al presionar solo un freno. Esto evita el bloqueo trasero por exceso de fuerza y reduce la distancia de frenado hasta un 30%.',
            },
            {
              emoji: '☀️',
              pregunta: '¿Para qué sirven las luces de circulación diurna (DRL) en moto?',
              opciones: [
                'Reemplazan los faros en la noche',
                'Aumentan la visibilidad de la moto para otros conductores durante el día',
                'Son obligatorias solo en motos de más de 250cc',
                'Ahoran combustible al ser más eficientes',
              ],
              correcta: 1,
              explicacion: 'Las DRL (Daytime Running Lights) hacen la moto visible de día, cuando los conductores de carros tienen más dificultad para detectar motos. El BID las identifica como medida de efectividad probada.',
            },
            {
              emoji: '🔍',
              pregunta: 'Los puntos ciegos de buses y camiones representan para el motociclista:',
              opciones: [
                'Un riesgo mínimo porque los conductores tienen obligación de mirarte',
                'Una zona donde el conductor del vehículo grande NO puede verte aunque uses luces',
                'Solo un problema al cambiar de carril',
                'Un riesgo que solo aplica en autopistas',
              ],
              correcta: 1,
              explicacion: 'Los puntos ciegos de vehículos grandes son zonas donde físicamente es imposible que el conductor te vea, sin importar sus espejos. Nunca te quedes en el ángulo muerto de un bus o camión.',
            },
            {
              emoji: '📊',
              pregunta: 'Según el BID, ¿cuál es el factor vehicular que más contribuye a accidentes de moto?',
              opciones: [
                'Motor de baja potencia',
                'Frenos en mal estado y llantas desgastadas',
                'Color oscuro de la moto',
                'Exceso de peso del vehículo',
              ],
              correcta: 1,
              explicacion: 'El BID señala que los frenos en mal estado y las llantas desgastadas son los principales factores vehiculares en accidentes de moto. Ambos se detectan en una inspección de 5 minutos.',
            },
            {
              emoji: '🔧',
              pregunta: '¿Con qué frecuencia mínima se recomienda revisar la presión de las llantas?',
              opciones: [
                'Solo cuando la llanta parezca visualmente baja',
                'Semanalmente o antes de rutas largas',
                'Cada 6 meses en el taller',
                'Solo en invierno cuando hace frío',
              ],
              correcta: 1,
              explicacion: 'La presión de llanta cambia con la temperatura y el uso. Una llanta con 20% menos presión puede verse "normal" visualmente pero ya perdió estabilidad y aumentó su temperatura de rodamiento.',
            },
          ],
        },
      },

      // ── NIVEL 3: Riesgos de infraestructura en la vía ─────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 3: Riesgos en la vía',
          instrucciones: 'Desliza ✅ si la acción es correcta o ❌ si representa un riesgo.',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '🕳️',
              situacion: 'Detectas un hueco profundo en la calzada. Hay espacio para desviarte reduciendo velocidad.',
              accionTexto: '¿Lo evitas reduciendo velocidad?',
              exito: 'Correcto. Los huecos en el asfalto pueden atrapar la llanta o provocar pérdida de control. Evitarlos con anticipación es la decisión correcta.',
              fallo: 'Un hueco puede atrapar la llanta delantera y tirar la moto en fracciones de segundo. Siempre anticipa y desvíate con tiempo.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🎨',
              situacion: 'Hay pintura horizontal recién aplicada en el paso peatonal. Está lloviendo.',
              accionTexto: '¿Aceleras para cruzar rápido?',
              exito: 'Correcto. La pintura mojada puede triplicar la distancia de frenado. Hay que cruzar a baja velocidad y sin frenar bruscamente.',
              fallo: 'La pintura horizontal mojada es casi tan resbalosa como el hielo. Acelerar sobre ella puede hacerte perder el control al instante.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🚌',
              situacion: 'Un bus grande te adelantó. Su zona trasera está justo al lado de tu moto.',
              accionTexto: '¿Te quedas en esa posición cerca de su costado?',
              exito: 'Bien. El ángulo muerto trasero-lateral de un bus puede ocultarte completamente al conductor. Adelántalo o retrásate para salir de esa zona.',
              fallo: 'El conductor del bus no puede verte en esa posición. Si abre la puerta, gira o frena, no tendrás tiempo de reaccionar.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🔲',
              situacion: 'La vía tiene juntas de concreto longitudinales (paralelas al sentido del tráfico). Quieres cambiar de carril sobre ellas.',
              accionTexto: '¿Cambias de carril directo sobre las juntas?',
              exito: 'Correcto. Las juntas longitudinales pueden atrapar la llanta si las cruzas en ángulo muy cerrado. Cruza perpendicular o con suficiente ángulo.',
              fallo: 'Las juntas longitudinales pueden atrapar la llanta delantera si las cruzas casi paralelo. Es una causa frecuente de caídas en zonas de concreto.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🌊',
              situacion: 'La vía tiene una zona con agua acumulada. Pasó un aguacero y no sabes qué tan profunda es.',
              accionTexto: '¿La cruzas a velocidad normal?',
              exito: 'Correcto. El agua puede ocultar huecos, tapas abiertas o desniveles. Crúzala a baja velocidad y en línea recta, sin frenar dentro del charco.',
              fallo: 'El agua estancada puede esconder huecos profundos, tapas de alcantarilla abiertas o desniveles. Cruzar rápido puede ser catastrófico.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
