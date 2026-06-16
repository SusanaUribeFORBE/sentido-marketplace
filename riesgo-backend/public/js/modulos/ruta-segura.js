window.MODULOS = window.MODULOS || {};

window.MODULOS['rutasegura'] = {
  titulo: 'Ruta Segura',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel 2.1: Manejo Defensivo',
          preguntas: [
            {
              id: 'ruta-distancia-seguridad',
              emoji: '🚗↔️🚚',
              texto: 'Vas a 60 km/h detrás de un camión en vía urbana.',
              pregunta: '¿Cuál es la distancia mínima de seguridad recomendada?',
              opciones: [
                'Al menos 2 segundos: cronometra desde que el camión pasa un punto fijo hasta que tú lo pasas',
                'Mínimo 5 metros son suficientes en ciudad',
                'Solo hay que mantener distancia en autopista',
                'La misma distancia que normalmente se mantiene en el tráfico',
              ],
              correcta: 0,
              explicacion: 'La regla de los 2 segundos ajusta la distancia automáticamente según la velocidad. A mayor velocidad, mayor distancia. En condiciones adversas (lluvia, noche) se amplía a 4 segundos.',
            },
            {
              id: 'ruta-punto-ciego',
              emoji: '🪟🔍',
              texto: 'Vas a cambiar de carril y revisas el espejo retrovisor: aparece libre.',
              pregunta: '¿Es seguro cambiar de carril de inmediato?',
              opciones: [
                'Sí, si el espejo dice que está libre, está libre',
                'No necesariamente: los espejos tienen ángulos ciegos; debes girar la cabeza para confirmar antes de maniobrar',
                'Sí, si además pones la direccional al mismo tiempo',
                'Solo si llevas más de 3 años de experiencia',
              ],
              correcta: 1,
              explicacion: 'Los espejos no cubren todos los ángulos. El punto ciego queda a los lados del vehículo y solo se verifica girando brevemente la cabeza antes de iniciar el cambio de carril.',
            },
            {
              id: 'ruta-adelantamiento',
              emoji: '🚗➡️🚚',
              texto: 'Vas a adelantar un vehículo en carretera de dos carriles.',
              pregunta: '¿Cuándo es seguro hacerlo?',
              opciones: [
                'Cuando el tramo es recto, hay visibilidad total y no hay vehículos en sentido contrario visibles',
                'Cuando el vehículo de adelante va muy lento, sin importar la señalización',
                'Cuando la señal de no adelantar lleva varios kilómetros sin cambiar',
                'Cuando conoces bien la carretera y calculas que llegas',
              ],
              correcta: 0,
              explicacion: 'Solo se puede adelantar en zona permitida, con visibilidad total del tramo, sin vehículos en sentido contrario y con espacio suficiente para completar la maniobra entera antes de regresar al carril.',
            },
            {
              id: 'ruta-interseccion-pare',
              emoji: '🛑🚦',
              texto: 'Llegas a una intersección con señal de PARE.',
              pregunta: '¿Qué exige exactamente esa señal?',
              opciones: [
                'Reducir la velocidad considerablemente y seguir si no hay nadie',
                'Detener completamente el vehículo, mirar en ambas direcciones y ceder el paso antes de avanzar',
                'Detenerse solo si hay vehículos visibles',
                'Tocar bocina para avisar que vas a pasar',
              ],
              correcta: 1,
              explicacion: 'La señal PARE exige detención completa (velocidad cero), no solo reducción. Luego debes confirmar que es seguro avanzar cediendo el paso a quien tenga prioridad.',
            },
            {
              id: 'ruta-zona-obra',
              emoji: '🚧👷',
              texto: 'Pasas por una zona de obra con señalización de velocidad máxima 30 km/h.',
              pregunta: '¿Por qué es tan importante respetar ese límite?',
              opciones: [
                'Solo para evitar la multa',
                'Hay trabajadores expuestos, maquinaria, pavimento irregular y señalización temporal: el riesgo es extremadamente alto',
                'Para no dañar el vehículo con el pavimento en mal estado',
                'Solo aplica en horario laboral cuando hay obreros visibles',
              ],
              correcta: 1,
              explicacion: 'Las zonas de obra son entornos de alto riesgo todo el tiempo: trabajadores a ras de vía, cambios bruscos de carril y pavimento irregular. El límite es obligatorio con o sin obreros visibles.',
            },
            {
              id: 'ruta-semaforo-amarillo',
              emoji: '🟡🚦',
              texto: 'El semáforo está en amarillo cuando llegas a la intersección.',
              pregunta: '¿Qué indica la luz amarilla según el Código Nacional de Tránsito?',
              opciones: [
                'Que puedes acelerar para pasar antes del rojo',
                'Que debes prepararte para detenerte: si puedes frenar con seguridad, hazlo',
                'Que tienes 5 segundos más para cruzar',
                'Que solo debes detenerte si hay peatones cruzando',
              ],
              correcta: 1,
              explicacion: 'La luz amarilla indica que el semáforo va a cambiar a rojo. Si puedes frenar de forma segura, debes detenerte. Acelerar para "alcanzar el verde" es una causa frecuente de accidentes en intersecciones.',
            },
          ],
        },
      },
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Sub-nivel 2.2: Peligros en Ruta',
          instrucciones: '¡Detecta el peligro en la vía y reacciona a tiempo con el gesto indicado para mantener el control!',
          retos: [
            {
              id: 'ruta-peligro-frenado-brusco',
              tipo: 'swipe-abajo',
              emoji: '🚗💥🚚',
              situacion: 'El vehículo de adelante frena de forma brusca e inesperada a alta velocidad.',
              accionTexto: '⬇️ Desliza para frenar progresivamente y mantener el control del vehículo',
              exito: 'Reaccionaste a tiempo y mantuviste la distancia de seguridad. La regla de los 2 segundos te dio el espacio necesario.',
              fallo: 'La distancia era insuficiente. Sin espacio de reacción, se produjo una colisión trasera.',
            },
            {
              id: 'ruta-peligro-animal-via',
              tipo: 'tap-repetido',
              emoji: '🐄🛣️',
              situacion: 'Un animal cruza repentinamente la vía a 80 km/h. Hay vehículos en el carril contrario: no puedes esquivar.',
              accionTexto: '¡CONTROLA EL VOLANTE Y FRENA PROGRESIVAMENTE!',
              tapsRequeridos: 5,
              exito: 'Mantuviste el control y frenaste progresivamente. Un volantazo o frenazo brusco habría causado una volcadura.',
              fallo: 'El volantazo brusco hizo perder el control. En esta situación, mantener el carril y frenar progresivamente es lo más seguro.',
            },
            {
              id: 'ruta-peligro-encandilamiento',
              tipo: 'swipe-lateral',
              emoji: '🔦😵',
              situacion: 'Un vehículo en sentido contrario te encandila con las luces largas en vía oscura sin separador.',
              accionTexto: '↔️ Desliza para desviar la vista al borde derecho de la vía y reducir la velocidad',
              exito: 'Desviaste la vista al borde derecho y redujiste velocidad. Así mantuviste la trayectoria sin quedar cegado.',
              fallo: 'Miraste directo a las luces: la ceguera temporal duró varios segundos sin poder ver la vía.',
            },
          ],
        },
      },
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel 2.3: Conducción en Condiciones Difíciles',
          preguntas: [
            {
              id: 'ruta-lluvia-velocidad',
              emoji: '🌧️🚗',
              texto: 'Está lloviendo fuerte y la vía está parcialmente inundada.',
              pregunta: '¿Qué debes hacer con la velocidad y la distancia?',
              opciones: [
                'Mantener la velocidad normal para salir más rápido de la zona',
                'Reducir la velocidad a máximo la mitad del límite habitual y aumentar la distancia con el vehículo de adelante',
                'Solo reducir si hay peatones cerca',
                'Encender las luces de emergencia y mantener la velocidad',
              ],
              correcta: 1,
              explicacion: 'Con lluvia intensa la distancia de frenado se duplica o triplica. Reducir a la mitad del límite y aumentar la distancia de seguimiento son medidas básicas en estas condiciones.',
            },
            {
              id: 'ruta-neblina-luces',
              emoji: '🌫️💡',
              texto: 'Hay neblina densa y la visibilidad es menor a 50 metros.',
              pregunta: '¿Qué luces debes usar?',
              opciones: [
                'Luces largas para ver más lejos',
                'Luces bajas y neblineros (si el vehículo los tiene): las luces largas reflejan en la neblina y empeoran la visibilidad',
                'Luces de emergencia mientras conduces',
                'No es necesario encender luces si es de día',
              ],
              correcta: 1,
              explicacion: 'Las luces largas en neblina crean un "muro de luz" que reduce aún más la visibilidad. Las luces bajas y neblineros cortan la neblina hacia abajo y mejoran la visión real del tramo.',
            },
            {
              id: 'ruta-noche-luces-largas',
              emoji: '🌙🔆',
              texto: 'Conduces de noche en carretera sin iluminación artificial con luces largas.',
              pregunta: '¿Cuándo debes cambiar a luces bajas?',
              opciones: [
                'Solo cuando el vehículo que viene está muy cerca',
                'Cuando detectas un vehículo en sentido contrario a unos 150 metros, para no encandilarlo',
                'Nunca: las luces largas siempre son más seguras de noche',
                'Solo en curvas cerradas',
              ],
              correcta: 1,
              explicacion: 'Las luces largas deben cambiarse a bajas cuando se detecta un vehículo en sentido contrario a unos 150 metros. Encandilarlo provoca ceguera temporal que puede ser fatal.',
            },
            {
              id: 'ruta-carretera-destapada',
              emoji: '🪨🛣️',
              texto: 'Conduces por una vía destapada con huecos y piedras sueltas.',
              pregunta: '¿Qué ajustes debes hacer?',
              opciones: [
                'Acelerar para pasar rápido los tramos malos',
                'Reducir la velocidad, aumentar la distancia con otros vehículos y verificar las llantas al inicio del tramo',
                'Mantener la misma velocidad que en vía pavimentada',
                'Solo reducir si hay vehículos en sentido contrario',
              ],
              correcta: 1,
              explicacion: 'En vías destapadas la adherencia es menor, los huecos pueden dañar la dirección o las llantas, y el polvo reduce la visibilidad. Velocidad reducida y mayor distancia de seguimiento son esenciales.',
            },
            {
              id: 'ruta-fatiga-viaje-largo',
              emoji: '😵🚗',
              texto: 'Llevas 2 horas de conducción continua y comienzas a sentir la mirada perdida.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Subir el volumen de la música para despejarte',
                'Hacer una pausa activa inmediata: detente en un lugar seguro, camina, hidrádate y descansa al menos 15 minutos',
                'Tomar un café y seguir; la fatiga pasa sola',
                'Reducir la velocidad y continuar conduciendo',
              ],
              correcta: 1,
              explicacion: 'La mirada perdida es una señal de fatiga avanzada. Ninguna técnica (música, café, ventana abierta) sustituye la pausa activa. Al menos 15 minutos de descanso restauran la alerta parcialmente.',
            },
            {
              id: 'ruta-zona-montana',
              emoji: '⛰️🚗',
              texto: 'Bajas una pendiente larga en zona de montaña con curvas.',
              pregunta: '¿Cuál es la práctica segura?',
              opciones: [
                'Ir en neutro para ahorrar combustible y frenar con el pedal cuando sea necesario',
                'Usar cambios bajos (freno de motor) y frenar intermitentemente, nunca de forma continua',
                'Frenar de forma constante durante todo el descenso',
                'Acelerar en las rectas y frenar fuerte solo en las curvas',
              ],
              correcta: 1,
              explicacion: 'El freno de motor (cambios bajos) evita el sobrecalentamiento de los frenos en descensos largos. El frenado continuo con el pedal puede causar pérdida total de frenos por recalentamiento.',
            },
          ],
        },
      },
      {
        tipo: 'obstaculos',
        config: {
          nombre: 'Sub-nivel 2.4: Actores Viales en Ruta',
          instrucciones: '¡Toca a cada actor vial vulnerable antes de que se acerque demasiado: en ruta también debes protegerlos!',
          total: 16,
          intervalo: 950,
          duracionCaida: 2800,
          tipos: ['🚶', '🚴', '🏍️', '🧑‍🦽', '👷'],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
