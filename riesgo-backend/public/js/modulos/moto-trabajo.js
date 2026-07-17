window.MODULOS['motoytrabajo'] = {
  titulo: 'Moto y Trabajo',
  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ── NIVEL 1: El mensajero en riesgo ───────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 1: El mensajero en riesgo',
          preguntas: [
            {
              emoji: '📦',
              pregunta: 'En México, ¿qué proporción de las motos vendidas se usan como herramienta de trabajo?',
              opciones: [
                '2 de cada 10',
                '4 de cada 10',
                '7 de cada 10',
                '9 de cada 10',
              ],
              correcta: 2,
              explicacion: 'Según AMFIM y el BID (2026), 7 de cada 10 motos vendidas en México en 2023 se usan para trabajar, especialmente en domicilios y mensajería — una actividad que explotó durante la pandemia.',
            },
            {
              emoji: '👨‍🔧',
              pregunta: '¿Cuál es el perfil más frecuente de la víctima fatal en moto en América Latina?',
              opciones: [
                'Mujer mayor de 50 años, conductora de fin de semana',
                'Hombre de 19 a 39 años, empleado, de bajos ingresos',
                'Joven estudiante de 15 a 17 años',
                'Adulto mayor de 60 años en zona rural',
              ],
              correcta: 1,
              explicacion: 'El BID (2026) confirma que el perfil más común de víctima fatal en moto en LAC es hombre de 19 a 39 años, empleado en sectores industriales o agropecuarios, con ingresos bajos. Son quienes más dependen de la moto para trabajar.',
            },
            {
              emoji: '😴',
              pregunta: '¿Por qué los domiciliarios y mensajeros tienen mayor riesgo que otros motociclistas?',
              opciones: [
                'Sus motos son de mayor cilindrada',
                'Combinan fatiga acumulada, presión de tiempo y alta exposición al tráfico durante horas seguidas',
                'No conocen las vías de la ciudad',
                'No pueden usar casco por el casco de trabajo',
              ],
              correcta: 1,
              explicacion: 'El trabajo en moto combina tres factores de riesgo simultáneos: fatiga (largas jornadas), presión de tiempo (el cliente espera) y exposición constante al tráfico. Esta combinación multiplica la probabilidad de error.',
            },
            {
              emoji: '🦠',
              pregunta: 'La pandemia de COVID-19 generó en el uso de motos de trabajo:',
              opciones: [
                'Una reducción por las restricciones de movilidad',
                'Un aumento significativo impulsado por el crecimiento de domicilios y delivery',
                'Sin cambios relevantes en el sector',
                'Una reducción de accidentes por menos tráfico general',
              ],
              correcta: 1,
              explicacion: 'El BID documenta que durante y después de la pandemia el uso de motos para delivery creció exponencialmente en Bogotá, Ciudad de México, Buenos Aires, São Paulo y Santiago. Más motos de trabajo = más riesgo.',
            },
            {
              emoji: '⚠️',
              pregunta: '¿Cuál de estas es una señal clara de que la fatiga está afectando tu conducción?',
              opciones: [
                'Tener hambre o sed',
                'Parpadeo frecuente, reacciones lentas y dificultad para concentrarse',
                'Escuchar música en el casco',
                'Sentir frío en las manos',
              ],
              correcta: 1,
              explicacion: 'El parpadeo frecuente, las reacciones lentas y la dificultad para mantener atención son señales neurológicas de fatiga. En esas condiciones, el tiempo de reacción puede triplicarse — el equivalente a conducir a ciegas.',
            },
          ],
        },
      },

      // ── NIVEL 2: Decisiones del domiciliario ──────────────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 2: Decisiones del domiciliario',
          instrucciones: 'Desliza ✅ si la decisión protege tu vida o ❌ si te pone en riesgo.',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '🕗',
              situacion: 'Llevas 8 horas seguidas en la moto. La app te asigna otro pedido urgente. Te sientes cansado.',
              accionTexto: '¿Aceptas el pedido sin descansar?',
              exito: 'Correcto. Después de 8 horas en moto, el tiempo de reacción se equipara al de una persona en estado de embriaguez. Un descanso de 20 minutos puede salvarte la vida.',
              fallo: 'Después de 8 horas, tu tiempo de reacción puede ser tan lento como el de alguien en estado de embriaguez. Ese pedido no vale un siniestro.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🚨',
              situacion: 'El cliente lleva 40 minutos esperando y te presiona. El semáforo está en rojo pero la vía parece despejada.',
              accionTexto: '¿Pasas el semáforo en rojo?',
              exito: 'Bien. Pasar un semáforo en rojo es la causa más frecuente de impactos laterales fatales. Ningún pedido justifica ese riesgo.',
              fallo: 'Pasar semáforo en rojo es la causa más común de colisiones laterales fatales en moto. El cliente puede esperar — los muertos no se recuperan.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🔍',
              situacion: 'Antes de salir al turno revisas llantas, frenos, luces y nivel de aceite.',
              accionTexto: '¿Vale la pena ese chequeo diario?',
              exito: 'Absolutamente. La inspección pre-ruta tarda 5 minutos y puede prevenir una falla mecánica en plena vía. Los profesionales del volante lo hacen siempre.',
              fallo: 'La inspección pre-ruta es lo que diferencia un conductor profesional de uno improvisado. Un fallo mecánico en ruta puede ser irreversible.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '😵',
              situacion: 'A mitad de una ruta larga sientes que te cuesta mantener la concentración y los ojos pesados.',
              accionTexto: '¿Paras 15 minutos y descansas?',
              exito: 'Exacto. Detenerte 15 minutos cuando detectas fatiga puede ser la decisión más inteligente de tu jornada. La fatiga no se combate acelerando.',
              fallo: 'Continuar con fatiga es apostar a que no pasará nada. La evidencia dice que los siniestros ocurren exactamente cuando el conductor ya no puede reaccionar.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🎒',
              situacion: 'La mochila del domicilio está sobredimensionada y sientes que la moto se balancea más de lo normal.',
              accionTexto: '¿Sales con esa carga sin ajustar?',
              exito: 'Correcto. Una carga mal distribuida altera el centro de gravedad de la moto y reduce la capacidad de maniobra. Redistribuye o reduce la carga antes de salir.',
              fallo: 'Una mochila sobredimensionada desplaza el centro de gravedad hacia arriba. En una curva o frenada de emergencia, ese desequilibrio puede tirarte.',
            },
          ],
        },
      },

      // ── NIVEL 3: Derechos y protección laboral ────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 3: Protección y derechos',
          preguntas: [
            {
              emoji: '🏥',
              pregunta: '¿Qué importancia tiene el SOAT activo en una moto de trabajo?',
              opciones: [
                'Solo sirve para pasar la revisión técnico-mecánica',
                'Cubre los gastos médicos de las víctimas en un accidente de tránsito — conductor y terceros',
                'Es opcional para motos usadas exclusivamente en trabajo',
                'Solo aplica si el conductor tiene contrato laboral',
              ],
              correcta: 1,
              explicacion: 'El SOAT cubre los gastos médicos de cualquier persona lesionada en el siniestro, incluyendo peatones, pasajeros y el conductor. Sin SOAT activo, esos gastos recaen directamente sobre el responsable del vehículo.',
            },
            {
              emoji: '📋',
              pregunta: '¿Cuál es la ventaja del sistema de licencias por puntos para reducir accidentes de trabajo en moto?',
              opciones: [
                'Permite conducir más rápido a los conductores con más puntos',
                'Reduce la reincidencia al sancionar comportamientos peligrosos antes de que causen una tragedia',
                'Otorga puntos extras por no tener multas',
                'Solo aplica para conductores mayores de 30 años',
              ],
              correcta: 1,
              explicacion: 'El sistema de puntos de la Comunidad Andina (del que hace parte Colombia) está diseñado para detectar patrones de comportamiento peligroso antes del accidente fatal. Cada infracción descuenta puntos — acumular pérdidas puede significar pérdida de la licencia.',
            },
            {
              emoji: '🦺',
              pregunta: 'Un mensajero en plataforma digital (app de domicilios) en Colombia debe:',
              opciones: [
                'No tiene obligación de afiliarse a ARL porque es trabajador independiente',
                'Afiliarse a ARL como independiente o exigir que la plataforma lo afilie, según el modelo contractual',
                'Solo afiliarse si gana más de 2 salarios mínimos al mes',
                'Afiliarse solo si tiene contrato laboral formal',
              ],
              correcta: 1,
              explicacion: 'Todo trabajador que use moto como herramienta de trabajo debe estar cubierto por ARL. La Ley 2209 de 2022 estableció mayor protección para trabajadores en plataformas digitales. Sin ARL, un accidente en trabajo puede dejarte sin atención médica ni incapacidad.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
