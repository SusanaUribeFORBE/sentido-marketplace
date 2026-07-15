window.MODULOS['induccionproaves'] = {
  titulo: 'Inducción ProAves',
  iniciar(container, { finalizar }) {
    const NIVELES = [

      // ── NIVEL 1: Historia, Misión y SST ───────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 1: Historia, Misión y Seguridad en el Trabajo',
          preguntas: [
            {
              emoji: '🦜',
              pregunta: '¿En qué año nació la Fundación ProAves y con qué misión?',
              opciones: [
                '1998, para salvar el Loro Orejiamarillo y proteger la biodiversidad de Colombia',
                '2001, para crear parques zoológicos en Antioquia',
                '2005, para exportar aves silvestres de forma controlada',
                '1990, para hacer turismo ornitológico en reservas privadas',
              ],
              correcta: 0,
              explicacion: 'ProAves nació en 1998 para salvar de la extinción al Loro Orejiamarillo (Ognorhynchus icterotis). Se estableció legalmente en 2001 en Jardín, Antioquia.',
            },
            {
              emoji: '🗺️',
              pregunta: '¿Cuántas Reservas Naturales administra ProAves en Colombia?',
              opciones: ['27 reservas en puntos estratégicos del país', '10 reservas exclusivamente en Antioquia', '50 reservas en toda Latinoamérica', '5 reservas en la Amazonia colombiana'],
              correcta: 0,
              explicacion: 'ProAves cuenta con 27 Reservas Naturales en puntos estratégicos de todo el país: Caribe, Nororiental, Noroccidental, Central, Suroccidental y Amazónica.',
            },
            {
              emoji: '⚠️',
              pregunta: '¿Qué es un "Incidente de Trabajo" según la Resolución 1401 de 2007?',
              opciones: [
                'Suceso con potencial de accidente donde no hubo lesiones ni daños a la propiedad',
                'Un accidente que causó lesiones graves al trabajador',
                'Una enfermedad profesional crónica derivada del trabajo',
                'Un paro laboral por condiciones inseguras detectadas',
              ],
              correcta: 0,
              explicacion: 'Un incidente es un suceso que tuvo el potencial de ser accidente, pero en el que no hubo lesiones, daños a la propiedad ni pérdida en los procesos.',
            },
            {
              emoji: '📋',
              pregunta: '¿Qué decreto único reglamenta el SG-SST en Colombia?',
              opciones: ['Decreto 1072 de 2015', 'Resolución 0312 de 2019', 'Ley 1562 de 2012', 'Decreto 2663 de 1950'],
              correcta: 0,
              explicacion: 'El Decreto 1072 de 2015 es el decreto único reglamentario del sector trabajo. Su capítulo 6 define todo lo que las empresas deben implementar en el SG-SST.',
            },
            {
              emoji: '🏥',
              pregunta: '¿A qué ARL están afiliados los colaboradores de ProAves y cuál es su línea de emergencias?',
              opciones: [
                'ARL SURA — 01800 0511414 opción 1, disponible 365 días al año',
                'ARL Positiva — 018000 112439',
                'ARL Colmena — 018000 912012',
                'ARL Liberty — 018000 0123999',
              ],
              correcta: 0,
              explicacion: 'Todos los colaboradores están cubiertos por ARL SURA. Ante un accidente, el jefe inmediato debe llamar al 01800 0511414 opción 1, disponible los 365 días, las 24 horas.',
            },
            {
              emoji: '🤝',
              pregunta: '¿Cuál es el objetivo del COCOLAB en ProAves?',
              opciones: [
                'Gestionar la convivencia laboral y hacer seguimiento al acoso laboral',
                'Desarrollar labores de inspección y vigilancia de equipos de campo',
                'Atender emergencias en reservas remotas',
                'Realizar censos mensuales de aves en las reservas',
              ],
              correcta: 0,
              explicacion: 'El COCOLAB (Comité de Convivencia Laboral) gestiona la convivencia de los trabajadores y hace seguimiento al acoso laboral dentro de la Fundación.',
            },
            {
              emoji: '📄',
              pregunta: '¿Cómo debe enviarse una incapacidad médica a Gestión Humana?',
              opciones: [
                'Escaneada en formato PDF — no se aceptan fotos, documentos ilegibles ni recortados',
                'En foto tomada desde el celular',
                'En un resumen verbal al jefe inmediato',
                'Solo es necesario el recibo del medicamento comprado',
              ],
              correcta: 0,
              explicacion: 'La incapacidad y la historia clínica deben entregarse escaneadas en PDF. No se admiten documentos en fotos, ilegibles, con datos recortados o incompletos.',
            },
            {
              emoji: '🦺',
              pregunta: '¿Qué son los EPP y cuál es tu obligación como colaborador?',
              opciones: [
                'Elementos de Protección Personal: usarlos es una obligación. Si están deteriorados, debes informarlo de inmediato',
                'Equipos de Productividad Personal: se usan solo cuando el jefe los exige',
                'Equipos para Protección de Plantas en viveros: de uso voluntario',
                'Elementos de Prevención de Pérdidas: solo para brigadistas de emergencia',
              ],
              correcta: 0,
              explicacion: 'Los EPP son mecanismos de barrera entre el trabajador y los riesgos de su trabajo. Usarlos es obligatorio. Si están deteriorados o no se ajustan a tu anatomía, repórtalo inmediatamente.',
            },
          ],
        },
      },

      // ── NIVEL 2: Reservas en Acción ────────────────────────────────
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 2: Reservas Naturales de ProAves en Acción',
          instrucciones: 'La conservación requiere acción inmediata. ¡Reacciona a tiempo para proteger la biodiversidad!',
          retos: [
            {
              tipo: 'swipe-lateral',
              emoji: '🦜',
              situacion: 'En la Reserva Loro Orejiamarillo (Jardín, Antioquia) vive el ave que inspiró la creación de ProAves. Un depredador amenaza el nido. ¡Actúa ahora!',
              accionTexto: '↔️ Desliza: desvía la amenaza y protege el nido',
              exito: '¡Bien! Nido protegido. El Loro Orejiamarillo sobrevive gracias a acciones de protección activa en campo. ProAves lo salvó de la extinción desde 1998.',
              fallo: 'El depredador alcanzó el nido. La conservación requiere intervención a tiempo. La vigilancia activa en campo es parte esencial del trabajo en ProAves.',
            },
            {
              tipo: 'tap-repetido',
              emoji: '🔭',
              situacion: 'ProAves ha trabajado con el 68% de las 1.968 especies de aves de Colombia. Es tiempo de censo en campo. ¡Registra cada especie antes de que el tiempo se acabe!',
              accionTexto: '👆 Toca rápido para registrar cada especie',
              exito: '¡Excelente! Censo completado. Los datos de campo son la base de las decisiones de conservación de ProAves. Cada registro cuenta.',
              fallo: 'Tiempo agotado. Los censos incompletos afectan la toma de decisiones. En ProAves, la rigurosidad en el registro de campo es fundamental.',
            },
            {
              tipo: 'swipe-abajo',
              emoji: '🐦',
              situacion: 'La Reserva Reinita Cielo Azul en Santander protege un ave migratoria amenazada. Se detectó una actividad ilegal cerca. ¡Activa el protocolo de protección!',
              accionTexto: '⬇️ Desliza: activa el protocolo de protección del hábitat',
              exito: '¡Correcto! Protocolo activado. La Reinita Cielo Azul es la primera especie migratoria en Sudamérica con una reserva creada exclusivamente para ella. ¡Tu reacción fue clave!',
              fallo: 'El protocolo no se activó a tiempo. Ante actividades ilegales en las reservas, la respuesta inmediata y el reporte al coordinador son obligatorios.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🐸',
              situacion: 'La Ranita Terribilis (Phyllobates terribilis) de Timbiquí, Cauca, es el vertebrado más venenoso del mundo. Un visitante no autorizado se acerca a su hábitat. ¡Intercepta!',
              accionTexto: '↔️ Desliza: intercepta al visitante antes de que llegue al área restringida',
              exito: '¡Perfecto! Visitante redirigido al sendero autorizado. Las áreas de hábitat crítico tienen acceso restringido. La seguridad del visitante y la del anfibio dependen de esta acción.',
              fallo: 'El visitante llegó al área restringida. El acceso no autorizado a hábitats críticos pone en riesgo tanto a la fauna como a las personas. El control de acceso es responsabilidad de todo el equipo.',
            },
            {
              tipo: 'tap-repetido',
              emoji: '🌱',
              situacion: 'El vivero de plantas nativas de la reserva necesita siembra urgente antes de la temporada de lluvias. La restauración de hábitat no puede esperar.',
              accionTexto: '👆 Toca para plantar cada plántula nativa',
              exito: '¡Vivero completado! La siembra de plantas nativas y la restauración de senderos son responsabilidades clave del equipo de campo de ProAves. Buen trabajo.',
              fallo: 'Siembra incompleta. La restauración de hábitat es una de las actividades más importantes en las reservas. Las plantas nativas son la base del ecosistema que ProAves protege.',
            },
          ],
        },
      },

      // ── NIVEL 3: Seguridad Vial en Campo ───────────────────────────
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 3: Seguridad Vial — Motociclistas, Peatones y Conductores',
          preguntas: [
            {
              emoji: '🏍️',
              pregunta: '¿Qué EPP es OBLIGATORIO para todo colaborador de ProAves que use motocicleta en funciones?',
              opciones: [
                'Casco certificado, guantes, chaqueta protectora, botas y chaleco reflectivo',
                'Solo el casco cuando llueve',
                'Gafas de sol y ropa deportiva cómoda',
                'Ninguno, la moto tiene protecciones integradas',
              ],
              correcta: 0,
              explicacion: 'El PESV de ProAves exige: casco certificado, guantes, chaqueta de protección, botas y chaleco reflectivo para todo motociclista en cumplimiento de funciones laborales.',
            },
            {
              emoji: '🔧',
              pregunta: 'Antes de salir en moto a una reserva, ¿qué inspección pre-operacional debes realizar?',
              opciones: [
                'Verificar frenos, luces, llantas, combustible y que el casco y EPP estén en buen estado',
                'Solo verificar que haya gasolina suficiente para el recorrido',
                'Revisar únicamente que las llantas no estén desinfladas',
                'No es necesaria ninguna inspección si el vehículo es nuevo',
              ],
              correcta: 0,
              explicacion: 'El PESV establece inspección diaria pre-operacional: frenos, luces (delantera, trasera, direccionales), llantas, combustible, espejos y estado de los EPP antes de cada salida.',
            },
            {
              emoji: '📵',
              pregunta: '¿Cuál es la conducta de mayor riesgo para un motociclista en vía?',
              opciones: [
                'Usar el celular mientras conduce',
                'Circular con las luces encendidas en el día',
                'Respetar el carril asignado en vías de doble calzada',
                'Disminuir la velocidad al acercarse a cruces peatonales',
              ],
              correcta: 0,
              explicacion: 'Usar el celular al conducir multiplica 4 veces el riesgo de accidente. En Colombia, un motociclista muere cada 3 horas. La distracción es la principal causa de siniestros viales.',
            },
            {
              emoji: '🚶',
              pregunta: 'Eres peatón y debes cruzar una carretera rural sin semáforo ni cruce marcado. ¿Qué haces?',
              opciones: [
                'Cruzar perpendicularmente verificando que no venga ningún vehículo por ambos lados',
                'Cruzar corriendo por cualquier punto de la vía',
                'Esperar en la mitad de la vía hasta que pase el tráfico',
                'Cruzar con el celular en la mano para consultar el mapa',
              ],
              correcta: 0,
              explicacion: 'El peatón debe cruzar perpendicularmente (camino más corto), mirar a ambos lados y no cruzar si hay vehículos próximos. Sin andén, caminar por el lado izquierdo mirando de frente al tráfico.',
            },
            {
              emoji: '🚨',
              pregunta: '¿Qué debe hacer un colaborador de ProAves involucrado en un accidente de tránsito en campo?',
              opciones: [
                'Llamar al 123, no mover al herido y reportar al jefe inmediato y a ARL SURA',
                'Mover al herido a un lugar seguro y continuar el recorrido',
                'Esperar a que otros conductores ayuden sin llamar a nadie',
                'Tomar fotos y publicarlas en redes sociales para documentar',
              ],
              correcta: 0,
              explicacion: 'Ante un accidente: 1) Llama al 123. 2) No mover al herido salvo peligro inmediato (riesgo de lesión medular). 3) Reportar al jefe inmediato. 4) Llamar a ARL SURA al 01800 0511414 si es accidente laboral.',
            },
            {
              emoji: '🚗',
              pregunta: '¿Qué exige el PESV de ProAves para los conductores de vehículos institucionales?',
              opciones: [
                'Licencia vigente, inspección diaria del vehículo y capacitación en manejo defensivo',
                'Solo licencia de conducción vigente',
                'Conocer las rutas de cada reserva sin necesidad de capacitación',
                'Revisar el vehículo una vez al mes en el taller autorizado',
              ],
              correcta: 0,
              explicacion: 'El PESV establece: licencia vigente para la categoría del vehículo, inspección diaria pre-operacional, uso de cinturón siempre y capacitación en manejo defensivo.',
            },
            {
              emoji: '🐢',
              pregunta: '¿A qué velocidad se debe circular dentro de las reservas naturales de ProAves?',
              opciones: [
                'A velocidad mínima controlada, priorizando la seguridad del ecosistema y las personas',
                '80 km/h, igual que en vía primaria',
                '60 km/h, igual que en zona urbana',
                'Sin límite, porque no hay tráfico en las reservas',
              ],
              correcta: 0,
              explicacion: 'En reservas y senderos la velocidad debe ser mínima. La fauna, los senderos angostos y el personal en campo hacen que cualquier velocidad excesiva sea un riesgo crítico.',
            },
            {
              emoji: '👁️',
              pregunta: '¿Cómo se protegen los colaboradores de ProAves como peatones en zonas de alto tráfico?',
              opciones: [
                'Chaleco reflectivo en vías de riesgo, cruzar solo por pasos peatonales y evitar audífonos al cruzar',
                'Correr para cruzar rápido sin importar el semáforo',
                'Caminar por la mitad de la vía para ser más visibles',
                'Usar el celular para consultar el mapa mientras caminan',
              ],
              correcta: 0,
              explicacion: 'La visibilidad y la atención plena son las mejores protecciones del peatón: chaleco reflectivo, cruzar solo por pasos peatonales y nunca usar audífonos o celular al cruzar.',
            },
          ],
        },
      },

    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
