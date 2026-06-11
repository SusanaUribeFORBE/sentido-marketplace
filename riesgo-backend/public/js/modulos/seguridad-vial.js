window.MODULOS = window.MODULOS || {};

window.MODULOS['seguridadvial'] = {
  titulo: 'Seguridad Vial',

  iniciar(container, { finalizar }) {
    const NIVELES = [
      {
        tipo: 'reaccion',
        config: {
          nombre: 'Nivel 1: La Ruta Segura',
          instrucciones: '¡Reacciona en menos de 2 segundos a cada situación del camino!',
          retos: [
            {
              tipo: 'tap-repetido',
              emoji: '🪖🏍️',
              situacion: 'Vas en moto hacia la obra y empieza a lloviznar.',
              accionTexto: '¡AJUSTAR Y ABROCHAR CASCO!',
              tapsRequeridos: 5,
              exito: 'Aseguraste bien el casco antes de continuar: tu cabeza está protegida.',
              fallo: 'Seguiste con el casco suelto, aumentando el riesgo en caso de caída.',
            },
            {
              tipo: 'swipe-abajo',
              emoji: '🚧🚛',
              situacion: 'Te acercas a una zona donde una retroexcavadora está maniobrando en reversa.',
              accionTexto: '⬇️ Desliza hacia abajo para detenerte y ceder el paso',
              exito: 'Te detuviste fuera del radio de giro, lejos del punto ciego del operador.',
              fallo: 'Avanzaste sin detenerte y entraste al punto ciego de la máquina.',
            },
            {
              tipo: 'swipe-lateral',
              emoji: '🚸🚶',
              situacion: 'Debes cruzar la vía de acceso vehicular para llegar al frente de obra.',
              accionTexto: '↔️ Desliza para mirar a ambos lados antes de cruzar',
              exito: 'Verificaste ambos sentidos y cruzaste por la zona señalizada para peatones.',
              fallo: 'Cruzaste sin mirar y casi fuiste golpeado por un vehículo de la obra.',
            },
          ],
        },
      },
      {
        tipo: 'trivia',
        config: {
          nombre: 'Nivel 2: Trivia de Seguridad Vial',
          preguntas: [
            {
              emoji: '🪖🏍️',
              texto: 'Te transportas en motocicleta hacia o desde la obra.',
              pregunta: '¿Qué elemento es obligatorio y no negociable para tu seguridad?',
              opciones: [
                'Casco bien abrochado y en buen estado',
                'Gafas de sol oscuras',
                'Chaqueta de cualquier color',
                'Guantes, sin importar el casco',
              ],
              correcta: 0,
              explicacion: 'El casco correctamente abrochado es el elemento de protección más importante para reducir lesiones graves en caso de accidente en moto.',
            },
            {
              emoji: '🚗🛣️',
              texto: 'Conduces un vehículo dentro de la zona de obra.',
              pregunta: '¿Cuál es la velocidad más segura a la que debes circular?',
              opciones: [
                'La máxima permitida en carretera, para avanzar rápido',
                'La señalizada para la zona de obra, generalmente muy baja',
                'No importa, mientras uses las luces direccionales',
                'La que lleven los demás vehículos',
              ],
              correcta: 1,
              explicacion: 'Dentro de una obra siempre debe respetarse la velocidad señalizada (usualmente muy baja), ya que hay peatones, maquinaria y visibilidad reducida.',
            },
            {
              emoji: '🚜👀',
              texto: 'Una maquinaria pesada (retroexcavadora, volqueta) está maniobrando cerca de ti.',
              pregunta: '¿Qué debes tener en cuenta sobre el operador?',
              opciones: [
                'Siempre te puede ver, sin importar dónde estés',
                'Tiene puntos ciegos: si tú no lo ves a él, él probablemente no te ve a ti',
                'Solo es peligrosa cuando se mueve hacia adelante',
                'No representa riesgo si está apagada',
              ],
              correcta: 1,
              explicacion: 'La maquinaria pesada tiene zonas ciegas amplias. La regla básica es: si no puedes ver al operador, asume que él no te ve a ti.',
            },
            {
              emoji: '🦺🚸',
              texto: 'Vas a caminar por una zona donde circulan vehículos de la obra.',
              pregunta: '¿Qué debes usar para ser visible?',
              opciones: [
                'Ropa de cualquier color, no afecta',
                'Chaleco o ropa con cintas reflectivas',
                'Solo es necesario de noche',
                'Un sombrero llamativo',
              ],
              correcta: 1,
              explicacion: 'El chaleco reflectivo permite que los conductores y operadores te identifiquen a tiempo, especialmente en zonas con poca luz o polvo.',
            },
            {
              emoji: '📱🚗',
              texto: 'Recibes una llamada o mensaje mientras conduces.',
              pregunta: '¿Qué debes hacer?',
              opciones: [
                'Contestar rápido y seguir conduciendo',
                'Usarlo con altavoz sin reducir la atención',
                'Detenerte en un lugar seguro antes de usar el celular',
                'Leer el mensaje en un semáforo en rojo',
              ],
              correcta: 2,
              explicacion: 'Usar el celular mientras se conduce distrae la atención y aumenta drásticamente el riesgo de accidente. Siempre detente en un lugar seguro primero.',
            },
            {
              emoji: '🍺🚫',
              texto: 'Un compañero va a manejar después de haber consumido alcohol.',
              pregunta: '¿Cuál es la actitud correcta frente a la seguridad vial?',
              opciones: [
                'Dejarlo manejar si el trayecto es corto',
                'No permitirlo: el alcohol nunca es compatible con conducir',
                'Permitirlo solo si maneja despacio',
                'No es un problema si conoce bien la ruta',
              ],
              correcta: 1,
              explicacion: 'El consumo de alcohol afecta los reflejos y el juicio. La política de cero alcohol al conducir protege a quien maneja y a los demás.',
            },
            {
              emoji: '🚙↔️🚙',
              texto: 'Vas en un vehículo y el de adelante frena de forma repentina.',
              pregunta: '¿Qué te protege de un choque por alcance?',
              opciones: [
                'Ir lo más cerca posible para reaccionar más rápido',
                'Mantener una distancia de seguridad adecuada',
                'Tocar bocina constantemente',
                'Cambiar de carril sin avisar',
              ],
              correcta: 1,
              explicacion: 'Mantener una distancia de seguridad con el vehículo de adelante da tiempo de reacción suficiente para frenar sin colisionar.',
            },
            {
              emoji: '🦺💺',
              texto: 'Te subes a una camioneta de la obra para un traslado corto.',
              pregunta: '¿Qué debes hacer antes de que el vehículo se mueva?',
              opciones: [
                'Nada, los traslados cortos no requieren precauciones',
                'Colocarte el cinturón de seguridad',
                'Sacar medio cuerpo por la ventana para ver mejor',
                'Solo el conductor necesita cinturón',
              ],
              correcta: 1,
              explicacion: 'El cinturón de seguridad es obligatorio para todos los ocupantes, sin importar la duración o distancia del trayecto.',
            },
          ],
        },
      },
    ];

    window.MotorJuego.iniciarSecuencia(container, NIVELES, finalizar);
  },
};
