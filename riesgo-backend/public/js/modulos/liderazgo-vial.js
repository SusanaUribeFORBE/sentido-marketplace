window.MODULOS = window.MODULOS || {};

window.MODULOS['liderazgovial'] = {
  titulo: 'Liderazgo Vial',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel L.1: Marco Legal y Responsabilidad Directiva',
          preguntas: [
            {
              id: 'liderazgo-responsable-pesv',
              emoji: '⚖️🏢',
              texto: 'La Ley 1503 de 2011 obliga a las empresas con vehículos a implementar un Plan Estratégico de Seguridad Vial (PESV).',
              pregunta: '¿A quién responsabiliza la ley del cumplimiento del PESV?',
              opciones: [
                'Solo al jefe de SST de la empresa',
                'Al representante legal y la alta dirección de la empresa',
                'Al conductor de mayor experiencia en la flota',
                'A la ARL que asesora a la empresa',
              ],
              correcta: 1,
              explicacion: 'La Ley 1503 ubica la responsabilidad en la alta dirección. El representante legal responde jurídicamente si el PESV no se implementa o es deficiente y ocurre un accidente.',
            },
            {
              id: 'liderazgo-sanciones',
              emoji: '🚨📄',
              texto: 'Una empresa obligada a tener PESV no lo implementa o lo tiene desactualizado.',
              pregunta: '¿Qué consecuencias puede enfrentar?',
              opciones: [
                'Solo una advertencia verbal de las autoridades de tránsito',
                'Multas de hasta 1.000 SMMLV, suspensión de la habilitación para operar y responsabilidad penal del representante legal',
                'Solo el pago del SOAT de los afectados en caso de accidente',
                'Un proceso administrativo sin consecuencias económicas reales',
              ],
              correcta: 1,
              explicacion: 'El incumplimiento del PESV puede generar multas severas, suspensión operativa y responsabilidad penal del representante legal, especialmente si ocurre un accidente fatal y se demuestra negligencia en la gestión vial.',
            },
            {
              id: 'liderazgo-comite-estrategico',
              emoji: '👔🛡️',
              texto: 'El PESV exige la conformación de un Comité Estratégico de Seguridad Vial (CESV).',
              pregunta: '¿Quién debe liderar este comité?',
              opciones: [
                'El jefe de mantenimiento de vehículos',
                'Un representante de la alta dirección: gerente, director o subgerente',
                'El conductor con más kilómetros recorridos sin accidentes',
                'Un asesor externo contratado por la ARL',
              ],
              correcta: 1,
              explicacion: 'El CESV debe estar liderado por la alta dirección. El liderazgo directivo activo es el factor que más impacta la cultura de seguridad vial: sin compromiso desde arriba, los programas no se sostienen.',
            },
            {
              id: 'liderazgo-ejemplo',
              emoji: '👁️🚗',
              texto: 'Un directivo usa el celular mientras conduce o supera los límites de velocidad en vehículos de la empresa.',
              pregunta: '¿Qué efecto tiene esto sobre la cultura de seguridad vial?',
              opciones: [
                'Ninguno; su ejemplo no influye en los conductores operativos',
                'Debilita la cultura vial: manda el mensaje de que las reglas son opcionales y aplican solo para algunos',
                'Solo afecta si los empleados lo ven directamente',
                'Es un asunto personal que no tiene relación con el PESV',
              ],
              correcta: 1,
              explicacion: 'La cultura de seguridad vial se construye desde arriba. Los directivos que no cumplen las normas erosionan cualquier programa de seguridad, por bien diseñado que esté. Predicar con el ejemplo es no negociable.',
            },
            {
              id: 'liderazgo-recursos-pesv',
              emoji: '💰📊',
              texto: 'La gerencia propone reducir el presupuesto del PESV para mejorar los márgenes del trimestre.',
              pregunta: '¿Cuál es el enfoque correcto para evaluar esa decisión?',
              opciones: [
                'Reducir el PESV no tiene consecuencias si los conductores son experimentados',
                'Comparar el costo del PESV con el costo real de un accidente: atención médica, incapacidades, sanciones legales, daños reputacionales y pérdida de productividad',
                'El PESV es solo un requisito legal sin impacto medible en la accidentalidad',
                'Invertir solo el mínimo que exige la ley para no recibir sanciones',
              ],
              correcta: 1,
              explicacion: 'Los accidentes viales laborales tienen costos directos e indirectos que superan ampliamente la inversión en prevención. Un PESV bien implementado puede reducir la siniestralidad entre un 30% y un 40%.',
            },
            {
              id: 'liderazgo-politica-vial',
              emoji: '📋✍️',
              texto: 'La política de seguridad vial es el documento que expresa el compromiso de la empresa con la seguridad en la vía.',
              pregunta: '¿Qué requisitos debe cumplir para ser efectiva?',
              opciones: [
                'Ser firmada solo por el jefe de SST para darle validez operativa',
                'Ser firmada por el representante legal, comunicada a todos los trabajadores y revisada periódicamente',
                'Estar disponible solo para los conductores con vehículos asignados',
                'Publicarse en la intranet; no se requieren más acciones',
              ],
              correcta: 1,
              explicacion: 'La política de seguridad vial tiene efectividad real cuando está firmada por el máximo directivo, comunicada activamente a toda la organización (no solo conductores) y revisada al menos una vez al año.',
            },
          ],
        },
      },
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Sub-nivel L.2: Decisiones Estratégicas',
          instrucciones: '¡Toma la decisión correcta como directivo ante cada dilema de seguridad vial y reacciona con el gesto indicado!',
          retos: [
            {
              id: 'liderazgo-presion-tiempo',
              tipo: 'swipe-abajo',
              emoji: '⏱️🚗',
              situacion: 'Un cliente estratégico exige que el conductor llegue 2 horas antes. Para lograrlo, deberá conducir 10 horas continuas sin pausas activas.',
              accionTexto: '⬇️ Desliza para negar la solicitud y proteger la seguridad del conductor',
              exito: 'Negaste la solicitud y comunicaste al cliente los límites de conducción segura. La relación comercial se mantuvo con credibilidad y sin riesgo.',
              fallo: 'Aprobaste el viaje sin pausas por la presión del cliente. El conductor sufrió un microsueño y ocurrió un accidente en ruta.',
            },
            {
              id: 'liderazgo-mantenimiento',
              tipo: 'tap-repetido',
              emoji: '🔧🚗',
              situacion: 'El reporte técnico indica que 3 vehículos de la flota necesitan mantenimiento urgente de frenos. El gerente de operaciones propone aplazarlo 2 semanas para no afectar la operación.',
              accionTexto: '¡APRUEBA EL MANTENIMIENTO INMEDIATO!',
              tapsRequeridos: 5,
              exito: 'Aprobaste el mantenimiento de inmediato. Los vehículos salieron temporalmente de operación y los frenos fueron reparados antes de un accidente.',
              fallo: 'Aplazaste el mantenimiento. Una semana después, uno de los vehículos tuvo una falla de frenos en vía y el conductor resultó herido.',
            },
            {
              id: 'liderazgo-denuncia-conductor',
              tipo: 'swipe-lateral',
              emoji: '📢⚠️',
              situacion: 'Un conductor reporta que su jefe directo lo presiona para exceder límites de velocidad y no registrar las horas reales de conducción.',
              accionTexto: '↔️ Desliza para investigar el caso y tomar medidas correctivas sobre el jefe directo',
              exito: 'Investigaste el caso, tomaste medidas correctivas y creaste un canal seguro para que los conductores reporten presiones indebidas.',
              fallo: 'Ignoraste el reporte. El conductor continuó siendo presionado y ocurrió un accidente por fatiga acumulada no reportada.',
            },
          ],
        },
      },
      {
        tipo: 'trivia',
        config: {
          nombre: 'Sub-nivel L.3: Indicadores y Gestión del PESV',
          preguntas: [
            {
              id: 'liderazgo-kpi-accidentalidad',
              emoji: '📈🚗',
              texto: 'La dirección quiere medir el desempeño en seguridad vial de forma comparable entre períodos.',
              pregunta: '¿Qué mide el índice de frecuencia de accidentes viales?',
              opciones: [
                'El número total de accidentes ocurridos en el año',
                'El número de accidentes por cada millón de kilómetros recorridos o por cada 100 trabajadores expuestos',
                'Solo los accidentes con víctimas fatales o con incapacidad permanente',
                'El costo total económico de los accidentes en el período',
              ],
              correcta: 1,
              explicacion: 'El índice de frecuencia normaliza la accidentalidad por exposición, permitiendo comparar el desempeño entre períodos y con otras empresas del sector, independientemente del tamaño de la flota.',
            },
            {
              id: 'liderazgo-casi-accidentes',
              emoji: '🔔⚠️',
              texto: 'La empresa registró 0 accidentes en el último trimestre, pero hay muchos incidentes viales sin reporte formal.',
              pregunta: '¿Qué le indica esto a la alta dirección?',
              opciones: [
                'Que el PESV está funcionando perfectamente y se puede reducir la inversión',
                'Que hay una cultura de no reporte que oculta señales de alerta; los incidentes son precursores de accidentes reales',
                'Que los conductores son excelentes y el riesgo vial está controlado',
                'Que el presupuesto del PESV puede redirigirse a otras prioridades',
              ],
              correcta: 1,
              explicacion: 'Por cada accidente grave hay decenas de incidentes menores no reportados. "Cero accidentes" con alto número de incidentes ocultos indica riesgos no gestionados que eventualmente generarán un siniestro grave.',
            },
            {
              id: 'liderazgo-inversion-roi',
              emoji: '💡💰',
              texto: 'La junta directiva pide justificar la inversión en seguridad vial en términos de negocio.',
              pregunta: '¿Cuál es el argumento más sólido?',
              opciones: [
                'Argumentar solo el cumplimiento legal como razón principal',
                'Mostrar el costo real de los accidentes (médico, legal, reputacional, productividad) frente al costo de la prevención: el ROI de la seguridad vial es positivo y medible',
                'Decir que es obligatoria por ley y no hay otra opción estratégica',
                'Comparar con competidores que no invierten y aún no han tenido accidentes',
              ],
              correcta: 1,
              explicacion: 'La seguridad vial tiene ROI demostrable. Cada peso invertido en prevención evita costos directos e indirectos mucho mayores. Presentar este análisis financiero es la forma más efectiva de obtener el apoyo directivo sostenido.',
            },
            {
              id: 'liderazgo-revision-pesv',
              emoji: '🔄📋',
              texto: 'La Resolución 40595 exige que la alta dirección revise formalmente los resultados del PESV.',
              pregunta: '¿Con qué frecuencia mínima debe hacerse esta revisión?',
              opciones: [
                'Cada 5 años cuando se renueva el plan estratégico',
                'Al menos una vez al año, con análisis de indicadores, avance de acciones y ajuste del plan',
                'Solo cuando ocurre un accidente con heridos',
                'Cuando la ARL o el Ministerio de Transporte lo soliciten',
              ],
              correcta: 1,
              explicacion: 'La revisión anual mínima por la alta dirección es la práctica estándar del PESV. Esta revisión formal con indicadores es lo que diferencia un PESV vivo de uno que existe solo en papel.',
            },
            {
              id: 'liderazgo-formacion-directivos',
              emoji: '🎓👔',
              texto: '¿Deben los directivos y gerentes recibir formación en seguridad vial?',
              pregunta: '¿Por qué sí o por qué no?',
              opciones: [
                'No; la formación vial es solo para los conductores operativos',
                'Sí: los directivos que deciden sobre flota, tiempos y rutas deben entender los riesgos viales para tomar decisiones informadas',
                'Solo si manejan ellos mismos los vehículos de la empresa',
                'Solo el gerente de operaciones necesita esta formación',
              ],
              correcta: 1,
              explicacion: 'Las decisiones directivas sobre presupuesto, tiempos de entrega, mantenimiento y selección de conductores tienen impacto directo en la accidentalidad. Un directivo formado en riesgos viales toma mejores decisiones estratégicas.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
