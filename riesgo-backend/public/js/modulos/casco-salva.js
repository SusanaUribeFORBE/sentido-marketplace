window.MODULOS['cascoquesalva'] = {
  titulo: 'Casco que Salva',
  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ── NIVEL 1: El casco correcto ────────────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 1: El casco correcto',
          preguntas: [
            {
              emoji: '⛑️',
              pregunta: '¿Cuál es el factor más importante para que un casco cumpla su función protectora?',
              opciones: [
                'Que esté correctamente sujetado con el barbijo ajustado',
                'El precio y la marca',
                'El color llamativo para ser visible',
                'El peso del casco',
              ],
              correcta: 0,
              explicacion: 'Según el BID (2026), la correcta sujeción del barbijo es tan determinante que podría reducir por sí sola una cantidad significativa de muertes, lesiones cerebrales y traumas maxilofaciales en siniestros viales.',
            },
            {
              emoji: '🧠',
              pregunta: 'En Colombia, ¿qué porcentaje de muertes de motociclistas se debe a trauma craneoencefálico (TBI)?',
              opciones: ['10%', '20%', '31%', '50%'],
              correcta: 2,
              explicacion: 'El 31% de los motociclistas que mueren en Colombia fallecen por trauma en la cabeza (ANSV Colombia). Por eso el casco bien puesto no es opcional — es la diferencia entre vivir y morir.',
            },
            {
              emoji: '🔄',
              pregunta: '¿Cuándo se debe reemplazar un casco?',
              opciones: [
                'Cada 10 años sin excepción',
                'Solo si tiene grietas o daños visibles',
                'Después de cualquier impacto fuerte, aunque parezca sin daño exterior',
                'Nunca, si se mantiene limpio',
              ],
              correcta: 2,
              explicacion: 'El interior del casco absorbe el impacto comprimiéndose de forma permanente. Aunque por fuera parezca intacto, ya perdió su capacidad protectora. No se puede reparar — debe reemplazarse.',
            },
            {
              emoji: '🛡️',
              pregunta: '¿Qué tipo de casco ofrece mayor protección integral?',
              opciones: [
                'Abierto (media cara)',
                'Integral de cara completa',
                'Modular en posición abierta',
                'Off-road sin visera',
              ],
              correcta: 1,
              explicacion: 'El casco integral protege cráneo, lados, mandíbula y cara completa. El casco abierto deja desprotegida la zona inferior del rostro, donde ocurren impactos frecuentes en caídas.',
            },
            {
              emoji: '👥',
              pregunta: 'Según el BID, ¿cuál es el mayor problema de uso del casco en Colombia?',
              opciones: [
                'Los cascos son demasiado costosos',
                'Solo el 52.7% de los pasajeros lo usa (vs. 79.2% de conductores)',
                'La ley no obliga al pasajero a usarlo',
                'No hay cascos disponibles en zonas rurales',
              ],
              correcta: 1,
              explicacion: 'La brecha conductor (79.2%) vs. pasajero (52.7%) muestra que casi la mitad de los pasajeros van sin casco. El pasajero es tan vulnerable como el conductor — y más desprotegido.',
            },
          ],
        },
      },

      // ── NIVEL 2: ¿Lo usas bien? ───────────────────────────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 2: ¿Lo usas bien?',
          instrucciones: 'Desliza ✅ si la acción es segura o ❌ si representa un riesgo vial.',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '😬',
              situacion: 'El casco está ladeado y el barbijo cuelga suelto. Quieres salir rápido.',
              accionTexto: '¿Arrancas así?',
              exito: 'Correcto. Sin barbijo ajustado el casco sale volando en el impacto. Siempre ciérralo antes de arrancar.',
              fallo: 'Peligro. Un casco sin sujetar puede salir en el momento del siniestro y no proteger nada.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🏘️',
              situacion: 'Vas a dar una vuelta muy corta, a dos cuadras de tu casa, a baja velocidad.',
              accionTexto: '¿Usas el casco?',
              exito: 'Exacto. El 75% de los accidentes ocurren a menos de 10 km del punto de partida. No existe la "vuelta sin riesgo".',
              fallo: 'El 75% de los accidentes ocurren cerca de casa. La distancia no protege — el casco sí.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '💥',
              situacion: 'Tu casco cayó fuerte al suelo desde la moto. No tiene grietas visibles por fuera.',
              accionTexto: '¿Sigues usándolo?',
              exito: 'Correcto. El EPS interior ya se comprimió. No tiene capacidad de absorber otro impacto. Es hora de reemplazarlo.',
              fallo: 'Incorrecto. El interior del casco se daña aunque no se vea por fuera. Ya no protegerá en el siguiente impacto.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🛵',
              situacion: 'El pasajero dice que con dos cuadras no necesita ponerse el casco.',
              accionTexto: '¿Arrancas sin que él use casco?',
              exito: 'Bien. Como conductor eres corresponsable de la seguridad de tu pasajero. Las dos cuadras pueden ser la más peligrosa.',
              fallo: 'Error. Como conductor eres corresponsable. Si el pasajero sufre un TBI, tú también llevas parte de esa responsabilidad.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🔓',
              situacion: 'Tienes un casco modular y saliste con la parte delantera levantada en posición abierta.',
              accionTexto: '¿Continúas así en la vía?',
              exito: 'Correcto. El reglamento ONU n.° 22 exige que los cascos modulares se usen en posición cerrada durante la conducción. Abierto no protege la mandíbula.',
              fallo: 'Incorrecto. La normativa internacional exige el casco modular cerrado. Abierto deja la cara desprotegida.',
            },
          ],
        },
      },

      // ── NIVEL 3: Pasajeros y niños ────────────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 3: Pasajeros y niños',
          preguntas: [
            {
              emoji: '👶',
              pregunta: '¿Por qué no se recomienda transportar niños en moto?',
              opciones: [
                'Es completamente ilegal en toda Colombia',
                'Los niños tienen el cuello más débil, el cráneo en desarrollo y la columna con más cartílago que hueso',
                'Los cascos infantiles no existen en el mercado',
                'Los niños no pueden sujetarse bien al asiento',
              ],
              correcta: 1,
              explicacion: 'Según el BID, el cuello de un niño tiene músculos más débiles y su columna todavía se está desarrollando. Un impacto que un adulto sobrevive puede ser fatal para un niño pasajero.',
            },
            {
              emoji: '🌍',
              pregunta: '¿Qué establece el Global Child Helmet Standard GCHS1:2025?',
              opciones: [
                'Que los niños no pueden ir en moto bajo ninguna circunstancia',
                'El primer estándar mundial con pruebas específicas para la anatomía infantil: impacto, estabilidad y retención',
                'Que los cascos de adulto pequeño sirven igual para niños',
                'Que solo niños mayores de 12 años pueden ir de pasajeros',
              ],
              correcta: 1,
              explicacion: 'El GCHS1:2025 es el primer estándar global diseñado específicamente para niños en motos y e-bikes. Incluye pruebas de impacto, estabilidad y absorción de energía adaptadas a la anatomía infantil.',
            },
            {
              emoji: '🚶',
              pregunta: 'En Colombia en 2024, ¿en qué porcentaje de muertes de peatones estuvieron involucradas las motos?',
              opciones: ['10%', '25%', '43%', '60%'],
              correcta: 2,
              explicacion: 'Las motos participaron en el 43% de las muertes de peatones en Colombia en 2024 (ANSV). Esto significa que el motociclista también es una amenaza para los más vulnerables de la vía.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
