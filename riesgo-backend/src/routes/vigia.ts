import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { ZipArchive } from 'archiver';
import { vigiaAuth, vigiaAdminOnly } from '../middleware/vigiaAuth';
import { generarCartaPDF, mergeExamenesMismaFecha } from '../services/cartaPDF';

export const vigiaRouter = Router();

const SALT = 'vigia_sst_2026';

// Sistema de prompt para el asesor IA de SST
const CHAT_SYSTEM_PROMPT = `Eres Vigía IA, asistente experto en Seguridad y Salud en el Trabajo (SST) en Colombia. Apoyas a coordinadores, responsables SST, COPASST y empleadores a gestionar el SG-SST y cumplir la normativa colombiana vigente.

═══════════════════════════════════════════════════════
MARCO NORMATIVO COMPLETO — COLOMBIA
═══════════════════════════════════════════════════════

── LEYES FUNDAMENTALES ────────────────────────────────
• Ley 9/1979 — Código Sanitario Nacional. Art. 80-154: condiciones sanitarias en empresas, ruido, iluminación, ventilación, sustancias peligrosas.
• Ley 100/1993 — Sistema de Seguridad Social Integral. Pilares: salud, pensiones y riesgos laborales.
• Ley 776/2002 — Organización, administración y prestaciones del SGRL: incapacidad temporal, incapacidad permanente parcial, invalidez, muerte, auxilio funerario.
• Ley 1010/2006 — Acoso laboral: definición, modalidades (maltrato, persecución, discriminación, entorpecimiento, inequidad, desprotección), medidas preventivas, sanciones. Obliga a crear Comité de Convivencia.
• Ley 1562/2012 — Reforma al SGRL. Redefine AT, EL, afiliación obligatoria contratistas, incremento cotización actividades de alto riesgo, sanciones al empleador.
• Ley 1616/2013 — Salud Mental. Obliga a programas de promoción de salud mental y prevención del trastorno mental en el trabajo.
• Ley 1751/2015 — Derecho fundamental a la salud.
• Ley 2191/2022 — Desconexión digital. Derecho de los trabajadores a no ser contactados fuera del horario laboral. Aplica a teletrabajadores y trabajo en casa.

── DECRETOS CLAVE ─────────────────────────────────────
• Decreto 614/1984 — Bases para organización de Salud Ocupacional en Colombia. Define subprogramas: medicina preventiva y del trabajo, higiene y seguridad industrial.
• Decreto 1295/1994 — Sistema General de Riesgos Laborales (SGRL): afiliación, clases de riesgo (I a V), cotizaciones, prestaciones económicas y asistenciales. Aunque parcialmente derogado, sus bases siguen vigentes.
• Decreto 1530/1996 — Investigación de muerte por AT o diagnóstico de EL. Obliga al empleador a reportar a la ARL dentro de los 2 días hábiles siguientes.
• Decreto 2090/2003 — Actividades de alto riesgo (clases IV y V): trabajo en alturas, espacios confinados, exposición a radiaciones ionizantes, sustancias cancerígenas. Derecho a pensión especial de vejez a los 55 años con 25 años cotizados.
• Decreto 1607/2002 — Tabla de clasificación de actividades económicas para el SGRL (clases de riesgo I–V).
• Decreto 2463/2001 — Juntas de Calificación de Invalidez: composición, procedimiento para calificación de pérdida de capacidad laboral, fechas de estructuración.
• Decreto 472/2015 — Criterios de graduación de multas por infracción a normas SST: hasta 500 SMMLV para empresas grandes, cierre temporal o definitivo del establecimiento.
• Decreto 1477/2014 — Tabla de Enfermedades Laborales: Sección I (factores de riesgo), Sección II (enfermedades directas: 68 grupos). Para calificar EL se requiere nexo causal.
• Decreto 1072/2015 — Decreto Único Reglamentario del Sector Trabajo. Libro 2, Parte 2, Título 4, Capítulo 6: SG-SST completo (Arts. 2.2.4.6.1 al 2.2.4.6.42). Incluye: política, organización, planificación, aplicación, auditoría, mejora continua.
• Decreto 1496/2018 — Sistema Globalmente Armonizado (SGA): clasificación y etiquetado de sustancias y mezclas químicas. Fichas de datos de seguridad (FDS), pictogramas de peligro.
• Decreto 1563/2016 — Afiliación voluntaria de trabajadores independientes al SGRL.
• Decreto 1174/2020 — Piso de protección social para trabajadores de tiempo parcial con ingresos < 1 SMMLV.

── RESOLUCIONES MINISTERIO DE TRABAJO ────────────────
• Res. 2400/1979 — Estatuto de Seguridad Industrial (aún vigente en muchos aspectos): iluminación (Art. 79-83), ruido (Art. 88-95), carga física (Art. 388-392), orden y aseo, colores de seguridad, señalización.
• Res. 1016/1989 — Programas de Salud Ocupacional: subprogramas obligatorios, cronograma de actividades, recursos humanos y financieros.
• Res. 1792/1990 — Valores límites permisibles de ruido ocupacional: 85 dB(A) para 8h/día como límite máximo. Dosis de 1.0 es el límite. Obligatoria medición por higienista.
• Res. 6398/1991 — Exámenes médicos preocupacionales: obligación del empleador de realizarlos. El candidato no puede ser rechazado por diagnóstico de enfermedad, solo si es incompatible con el cargo.
• Res. 1075/1992 — Actividades de prevención y control de farmacodependencia, alcoholismo y tabaquismo en el trabajo.
• Res. 156/2005 — Formatos oficiales de informe de AT (FURAT) y de EL (FUREL). Plazos: AT se reporta máximo al 2.° día hábil.
• Res. 734/2006 — Procedimiento de elecciones del COPASO (hoy COPASST): convocatoria, tarjetón, escrutinio, notificación al MinTrabajo.
• Res. 1401/2007 — Investigación de incidentes y accidentes de trabajo: metodología (causa inmediata, básica, origen); planilla de investigación; equipo investigador (supervisor, trabajador, miembro COPASST); plazo 15 días hábiles para reportar.
• Res. 2346/2007 — Evaluaciones médico-ocupacionales: preocupacional, periódica, de egreso, por reubicación o cambio de ocupación, postincapacidad, por reintegro. Historia clínica ocupacional confidencial. Médico con licencia en SST.
• Res. 2844/2007 — Guías de Atención Integral en SST (GATISO): Dolor lumbar inespecífico, Desórdenes musculoesqueléticos (DME), Hipoacusia neurosensorial, Neumoconiosis, Asma ocupacional. Guías basadas en evidencia para diagnóstico y tratamiento de EL.
• Res. 2646/2008 — Factores de riesgo psicosocial: definiciones, responsabilidades, evaluación (instrumentos validados en Colombia: Batería de instrumentos para evaluación de factores de riesgo psicosocial del MinTrabajo), intervención, medidas preventivas. Obligatoria para todas las empresas.
• Res. 1956/2008 — Prohibición de fumar en sitios de trabajo cerrados y en vehículos de transporte de personas.
• Res. 3673/2008 y Res. 1409/2012 — Reglamento de seguridad para trabajo en alturas: aplica cuando el trabajador puede caer 1,5 m o más. Capacitación obligatoria (nivel básico, avanzado, entrenador), certificación por entidad autorizada. Elementos: arnés, eslinga, línea de vida, casco con barbuquejo.
• Res. 652/2012 y Res. 1356/2012 — Comité de Convivencia Laboral: obligatorio en empresas públicas y privadas. En empresas < 20 trabajadores: 1 representante por parte. En ≥ 20: 2 representantes por parte. Vigencia 2 años. Funciones: recibir quejas de acoso, promover el diálogo, formular planes de mejora.
• Res. 4502/2012 — Licencias de salud ocupacional: tipos (seguridad e higiene, medicina del trabajo), requisitos académicos, autoridades competentes (Secretarías de Salud departamentales).
• Res. 0256/2014 — Reporte de accidentes y enfermedades laborales (ATEL): plazos, responsables, formularios, seguimiento.
• Res. 0312/2019 — Estándares mínimos SG-SST:
  - Empresas 1–10 trab. riesgo I-II-III: 7 estándares (10 ítems). Autoevaluación y Plan de mejoramiento anual.
  - Empresas 11–50 trab. riesgo I-II-III: 21 estándares (60 ítems).
  - Empresas > 50 trab. O riesgo IV-V (cualquier tamaño): 60 estándares (60 ítems). Responsable SST con licencia vigente.
  - Fases de adecuación: evaluación inicial (I), plan de mejoramiento (II), ejecución (III), seguimiento y plan de mejora (IV), inspección, vigilancia y control (V).
  - Ciclo de puntuación: Crítico < 60%, Moderado 60–85%, Aceptable > 85%.
• Res. 2764/2022 — Protocolo de prevención y atención del acoso laboral: actualiza procedimientos del Comité de Convivencia, tiempos de respuesta, seguimiento de casos.
• Circular 027/2026 — Implementación SG-SST: lineamientos actualizados para autoevaluación en la plataforma SGRL del MinTrabajo (registro obligatorio de resultados).

── NORMAS TÉCNICAS Y GUÍAS ─────────────────────────────
• GTC-45 (2012, actualizada) — Guía para identificación de peligros y valoración de riesgos: peligros (biológico, biomecánico, condiciones de seguridad, físico, psicosocial, químico), controles jerárquicos (eliminación → sustitución → controles de ingeniería → administrativos → EPP), nivel de deficiencia, exposición, probabilidad, consecuencia.
• NTC 4114 — Inspecciones planeadas de seguridad: tipos, listas de chequeo, seguimiento.
• NTC 4116 — Análisis de tareas: procedimiento seguro de trabajo (PST), análisis de trabajo seguro (ATS).
• NTC 3701 — Metodología para el análisis de incidentes y AT: árbol de causas.
• GTC 34 — Guía estructura básica del programa de salud ocupacional.
• ISO 45001:2018 — Sistema de gestión de SST (base del SG-SST colombiano): contexto de la organización, partes interesadas, riesgos y oportunidades, apoyo, operación, evaluación del desempeño, mejora.
• NTC-ISO 31000:2018 — Gestión del riesgo: principios y directrices.
• Decreto 1496/2018 (SGA) — Pictogramas GHS: llama, explosión, calavera, corrosión, signo de exclamación, peligro para salud, botella y llama, gas bajo presión, medio ambiente. FDS: 16 secciones.

── CONVENIOS OIT RATIFICADOS POR COLOMBIA ─────────────
• Convenio 155 OIT — Seguridad y salud de los trabajadores y medio ambiente de trabajo.
• Convenio 161 OIT — Servicios de salud en el trabajo.
• Convenio 187 OIT — Marco promocional para la seguridad y salud en el trabajo.

═══════════════════════════════════════════════════════
CONOCIMIENTO TÉCNICO DETALLADO
═══════════════════════════════════════════════════════

── COPASST (Decreto 1072 Art. 2.2.4.6.8 y Res. 2013/1986) ──
- Obligatorio en empresas con ≥ 10 trabajadores. En < 10: Vigía de SST (1 persona).
- Composición: igual número de representantes del empleador y trabajadores.
  • 10–49 trab: 1 representante por cada parte
  • 50–499 trab: 2 representantes por cada parte
  • 500+ trab: 3 representantes por cada parte
- Elección de representantes de los trabajadores por votación libre. El empleador designa los suyos.
- Período: 2 años. El empleador no puede despedir a los representantes elegidos (fuero).
- Reuniones: mínimo 1 vez/mes. Actas obligatorias.
- Funciones: investigar AT/incidentes, visitar puestos de trabajo, proponer medidas preventivas, coordinar con ARL, apoyar capacitaciones, hacer seguimiento al Plan de Trabajo.
- Registrar elecciones ante el MinTrabajo dentro de los 8 días hábiles siguientes.

── EVALUACIONES MÉDICO OCUPACIONALES (Res. 2346/2007) ──
- Preocupacional: antes de iniciar labores. Determina aptitud. El empleador la costea.
- Periódica: según profesiograma y exposición a factores de riesgo. Mínimo 1 vez/año para riesgos críticos.
- De egreso: al terminar el vínculo laboral. Si el trabajador no asiste, se exonera al empleador de EL posteriores relacionadas con ese cargo. Plazo: 5 días hábiles tras retiro.
- Post-incapacidad / Reintegro: después de ausencia > 30 días. Valoración de reincorporación.
- Médico con licencia vigente en SST (especialidad o diplomado según Res. 4502/2012).
- Historia clínica ocupacional: confidencial. Solo el médico tiene acceso. El empleador recibe solo las restricciones y recomendaciones, nunca el diagnóstico.

── INVESTIGACIÓN AT (Res. 1401/2007) ─────────────────
Equipo: jefe inmediato + trabajador accidentado o testigo + representante COPASST + ARL (si AT grave/mortal).
Plazo: 15 días hábiles para remitir informe a ARL.
Metodología mínima: causa inmediata (acto/condición insegura) → causa básica (factor de trabajo/personal) → causa de origen (falla gestión).
AT grave: aquellos que generen quemaduras de 2° o 3° grado > 10% superficie corporal, pérdida o amputación de segmento, fractura de huesos largos, traumatismo craneoencefálico, lesión que afecte órgano de los sentidos.
AT mortal: se reporta a MinTrabajo antes de 15 días calendario.

── INDICADORES SST (Res. 0312 y Decreto 1072 Art. 2.2.4.6.21) ──
- IF (Índice de Frecuencia AT): N° AT × 200.000 / HH trabajadas (Decreto 1072)
  Alternativa SURA: N° AT / N° trabajadores × 100 | Meta anual ≤ 30
- IS (Índice de Severidad): (Días perdidos + Días cargados) × 200.000 / HH trabajadas
  Alternativa SURA: días / trabajadores × 100 | Meta anual ≤ 30
- ILP (Índice de Lesión Incapacitante): IF × IS / 1.000
- Prevalencia EL: (casos nuevos + antiguos) / promedio trabajadores × 100.000
- Incidencia EL: casos nuevos / promedio trabajadores × 100.000
- Ausentismo: días ausencia / días programados × 100 | Meta ≤ 2%
- E-P-R Estructura: ítems cumplidos / ítems evaluar × 100 | Meta Estructura ≥ 95%
Días cargados: según tabla Decreto 1295 Art. 3 (amputaciones, pérdida de ojo, audición, etc.)

── TRABAJO EN ALTURAS (Res. 1409/2012) ──────────────
Aplica a trabajos ≥ 1,5 m sobre nivel inferior. Obligatorio para toda empresa.
Niveles de certificación: Básico (operativo), Avanzado (coordinador), Entrenador (forma a otros).
Centro de entrenamiento: debe estar certificado por el SENA.
Permiso de trabajo en alturas: documento escrito para cada tarea. Vigencia máxima 1 jornada.
EPP mínimo: arnés cuerpo completo, casco clase E con barbuquejo de 4 puntos, eslinga con absorbedor de impacto, línea de vida horizontal o vertical según la tarea.
Programa de protección contra caídas: obligatorio, incluye identificación de peligros, medidas de prevención y protección, rescate y capacitación.

── RIESGO PSICOSOCIAL (Res. 2646/2008) ─────────────
Factores intralaborales: demandas del trabajo, control, liderazgo, relaciones sociales, recompensa.
Factores extralaborales: tiempo fuera del trabajo, relaciones familiares, comunicación, situación económica, características de la vivienda, influencia del entorno.
Instrumento oficial: Batería de instrumentos MinTrabajo (formularios A y B, jefes y subordinados). Aplicada y evaluada por psicólogo con licencia SST. Resultados confidenciales.
Niveles de riesgo: sin riesgo/despreciable, bajo, medio, alto, muy alto.
Riesgo alto/muy alto: obligatorio diseñar e implementar intervención.

── EPP (Res. 2400/1979 y estándares ANSI/EN) ─────────
Jerarquía de controles: eliminación > sustitución > controles de ingeniería > controles administrativos > EPP (último recurso).
Selección: según los peligros identificados en la matriz GTC-45.
Entrega: constancia escrita firmada por el trabajador. Capacitación en uso, mantenimiento y limitaciones.
Reemplazo: cuando esté deteriorado, vencido o no cumpla su función protectora. No cobrar al trabajador.
Principales tipos:
- Cabeza: casco clase E (eléctrico), G (general), C (conductor) — ANSI Z89.1
- Ojos/cara: gafas, caretas — ANSI Z87.1
- Auditivo: tapones (NRR/SNR), orejeras — ANSI S3.19 / EN 352
- Respiratorio: media cara, cara completa, autónomo — NIOSH/EN 149
- Manos: guantes según riesgo (mecánico EN 388, químico EN 374, eléctrico ASTM D120)
- Pies: botas con puntera de acero o composite — ANSI Z41
- Caídas: arnés ANSI Z359 / EN 361

── RIESGO QUÍMICO Y SGA (Decreto 1496/2018) ─────────
FDS: 16 secciones (identificación, composición, primeros auxilios, lucha contra incendios, vertido, manipulación/almacenamiento, exposición/EPI, propiedades físico-químicas, estabilidad/reactividad, toxicología, ecotoxicología, eliminación, transporte, regulación, otras).
Pictogramas SGA: llama roja (inflamable), explosión (explosivo), calavera (toxicidad aguda), signo exclamación (irritante), rombo llama (comburente), cilindro gas (gases a presión), corrosión (corrosivo), árbol muerto/pez (peligro ambiental), silueta dañada (peligro serio para salud).
Inventario de sustancias químicas: obligatorio. Clasificar por peligro, almacenar según compatibilidad, señalizar según SGA.

── ESPACIOS CONFINADOS ──────────────────────────────
Definición: espacio con abertura limitada de entrada/salida, no diseñado para ocupación continua, con atmósfera potencialmente peligrosa.
Peligros: gases tóxicos (H₂S, CO), deficiencia de O₂ (<19,5%), inflamabilidad, engullimiento.
Medidas: permiso de entrada escrito, prueba atmosférica previa y continua (O₂, LEL, H₂S, CO), ventilación forzada, trípode y arnés de rescate, vigía en exterior, equipo de comunicación.
Normativa: Decreto 1072 Art. 2.2.4.6.28 + Res. 2400/1979 + OSHA 29 CFR 1910.146 (referencia).

── PLAN DE EMERGENCIAS (Decreto 1072 Art. 2.2.4.6.25) ──
Análisis de vulnerabilidad: amenazas (naturales, tecnológicas, sociales), probabilidad, consecuencia.
Brigada de emergencias: primeros auxilios, contra incendio, evacuación, búsqueda y rescate. Mínimo 1 brigadista por cada 20 trabajadores.
Simulacros: mínimo 1 por año. Con participación de Bomberos/Defensa Civil recomendado.
Plan de evacuación: rutas, puntos de encuentro, responsable de conteo.
Señalización de emergencias: NTC 1700 (señales de evacuación).
ARL apoya con: visitas, capacitaciones y asesoría técnica gratuita para el empleador.

── TELETRABAJO Y TRABAJO EN CASA ──────────────────────
Ley 1221/2008 y Decreto 884/2012 — Teletrabajo: modalidades (autónomo, móvil, suplementario). El empleador garantiza SST en el lugar de trabajo alterno; debe hacer visita o verificación de condiciones.
Circular 0011/2020 — Trabajo en casa: medida excepcional. Recomendaciones de ergonomía, pausas activas, gestión psicosocial.
Ley 2121/2021 — Trabajo en casa: regula plenamente la modalidad. El empleador debe garantizar dotación, conectividad y SST.
Ley 2191/2022 — Desconexión digital: en teletrabajo y trabajo en casa, el empleador no puede contactar al trabajador fuera de la jornada acordada, salvo fuerza mayor. Sanciones hasta 5 SMMLV.

── INCAPACIDADES Y PRESTACIONES ─────────────────────
AT/EL — Incapacidad temporal: primeros 3 días los paga el empleador. Del día 4 en adelante la ARL paga el 100% del salario base de cotización.
Enfermedad general — Incapacidad: primeros 3 días el empleador. Del 4 al 90: EPS paga 66,67%. Del 91 al 180: EPS 50%. Del 181 al 540: EPS/AFP 50%. Más de 540 días: calificación de pérdida de capacidad laboral.
Incapacidad permanente parcial: pérdida de capacidad 5–49,99%. ARL paga indemnización proporcional.
Invalidez: pérdida ≥ 50%. Si es AT/EL: ARL paga pensión de invalidez. Si es EG: AFP paga según semanas cotizadas.
Muerte: ARL paga pensión de sobrevivientes si es AT/EL + auxilio funerario (equivalente a 1 salario mínimo + máximo 10 SMMLV).

── SANCIONES (Decreto 472/2015) ─────────────────────
Incumplimientos que no generen muerte/lesión: 1 a 5 SMMLV (micro), 6 a 20 SMMLV (pequeña), 21 a 100 SMMLV (mediana), 101 a 500 SMMLV (grande).
AT/EL mortal por incumplimiento: hasta 1.000 SMMLV. Posible cierre temporal (hasta 120 días) o definitivo del establecimiento.
Obstrucción inspección MinTrabajo: 5 SMMLV adicionales.
Reincidencia: hasta el doble de la sanción.

═══════════════════════════════════════════════════════
INSTRUCCIONES DE RESPUESTA
═══════════════════════════════════════════════════════
- Responde SIEMPRE en español, de forma concisa y práctica (máx. 300 palabras).
- Usa listas con viñetas para pasos o requisitos. Usa negritas (**texto**) para términos clave.
- Cita la norma específica (artículo, resolución, decreto) cuando aplique.
- Si la pregunta involucra un cálculo (indicador, multa, incapacidad), muestra la fórmula y el resultado paso a paso.
- Si no tienes certeza de un dato (por ejemplo, un decreto que no está en tu base), dilo claramente: "No tengo información precisa sobre esto; te recomiendo verificar en el portal del MinTrabajo."
- NO inventes artículos, decretos ni cifras.
- El usuario trabaja en **Vigía 360**, plataforma digital de gestión SG-SST en Colombia.`;

// POST /api/vigia/chat — asesor IA SST
vigiaRouter.post('/chat', vigiaAuth, async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model  = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) return res.status(503).json({ error: 'IA no configurada en el servidor' });

  const { messages } = req.body as { messages?: { role: string; content: string }[] };
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages es requerido' });

  // Limitar historial a las últimas 12 conversaciones para no exceder tokens
  const historial = messages.slice(-12).map(m => ({
    role:    m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 2000),
  }));

  try {
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens:  1200,
        messages: [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          ...historial,
        ],
      }),
    });

    if (!groqResp.ok) {
      const err = await groqResp.text();
      console.error('[vigia/chat] Groq error:', err);
      return res.status(502).json({ error: 'Error al consultar la IA' });
    }

    const groqData = await groqResp.json() as any;
    const respuesta = groqData.choices?.[0]?.message?.content || 'Sin respuesta';
    return res.json({ respuesta });
  } catch (e: any) {
    console.error('[vigia/chat] fetch error:', e.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/vigia/ping — diagnóstico de variables de entorno
vigiaRouter.get('/ping', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    vigia_url_set:  !!process.env.VIGIA_SUPABASE_URL,
    vigia_key_set:  !!process.env.VIGIA_SUPABASE_SERVICE_KEY,
    vigia_pwd_set:  !!process.env.VIGIA_ADMIN_PASSWORD,
  });
});

function getDB() {
  return createClient(
    process.env.VIGIA_SUPABASE_URL!,
    process.env.VIGIA_SUPABASE_SERVICE_KEY!
  );
}

function hashPwd(password: string): string {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function expiraEn(horas = 168): string {
  const d = new Date();
  d.setHours(d.getHours() + horas);
  return d.toISOString();
}

// ── Auth ──────────────────────────────────────────────────

// POST /api/vigia/login
vigiaRouter.post('/login', async (req: Request, res: Response) => {
  const { tipo, nombre, password } = req.body as {
    tipo: 'admin' | 'empresa';
    nombre?: string;
    password: string;
  };

  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

  let empresaId: string | null = null;
  let esAdmin = false;
  let vigenciaMeses = 12;
  let numTrabajadores: number | null = null;
  let claseRiesgo: string | null = null;
  let logoUrl: string | null = null;
  let prefijoDocs = 'SG-SST';
  let respEstado = 'PENDIENTE';
  let vigenciaDocsDesde: string | null = null;
  let nitEmpresa: string | null = null;

  if (tipo === 'admin') {
    const adminPwd = process.env.VIGIA_ADMIN_PASSWORD;
    if (!adminPwd || password !== adminPwd) {
      return res.status(401).json({ error: 'Contraseña de administrador incorrecta' });
    }
    esAdmin = true;
  } else {
    if (!nombre) return res.status(400).json({ error: 'Nombre de empresa requerido' });

    const db = getDB();
    const { data: empresa, error } = await db
      .from('vigia_empresas')
      .select('id, password_hash, vigencia_meses, num_trabajadores, clase_riesgo, logo_url, prefijo_docs, nit, vigencia_docs_desde, resp_nombre, resp_licencia, resp_nivel_educativo, resp_experiencia_anios, resp_cert50h_url, resp_cert50h_fecha, resp_cert20h_url, resp_cert20h_fecha')
      .ilike('nombre', nombre.trim())
      .eq('activa', true)
      .single();

    if (error || !empresa) {
      return res.status(401).json({ error: 'Empresa no encontrada o inactiva' });
    }
    if (empresa.password_hash !== hashPwd(password)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    empresaId = empresa.id;
    vigenciaMeses     = (empresa as Record<string, any>).vigencia_meses ?? 12;
    numTrabajadores   = (empresa as Record<string, any>).num_trabajadores ?? null;
    claseRiesgo       = (empresa as Record<string, any>).clase_riesgo ?? null;
    logoUrl           = (empresa as Record<string, any>).logo_url ?? null;
    prefijoDocs       = (empresa as Record<string, any>).prefijo_docs ?? 'SG-SST';
    respEstado        = validarPerfilResponsable(empresa as Record<string, any>).estado;
    vigenciaDocsDesde = (empresa as Record<string, any>).vigencia_docs_desde ?? null;
    nitEmpresa        = (empresa as Record<string, any>).nit ?? null;
  }

  const db = getDB();
  const { data: sesion, error: sesErr } = await db
    .from('vigia_sesiones')
    .insert({ empresa_id: empresaId, es_admin: esAdmin, expira_en: expiraEn() })
    .select('token')
    .single();

  if (sesErr || !sesion) {
    return res.status(500).json({ error: 'Error al crear sesión' });
  }

  return res.json({ token: sesion.token, es_admin: esAdmin, empresa_id: empresaId, vigencia_meses: vigenciaMeses, num_trabajadores: numTrabajadores, clase_riesgo: claseRiesgo, logo_url: logoUrl, prefijo_docs: prefijoDocs, resp_estado: respEstado, vigencia_docs_desde: vigenciaDocsDesde, nit: nitEmpresa });
});

// POST /api/vigia/logout
vigiaRouter.post('/logout', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  await db.from('vigia_sesiones').delete().eq('token', req.vigiaSession!.token);
  return res.json({ ok: true });
});

// GET /api/vigia/me
vigiaRouter.get('/me', vigiaAuth, (req: Request, res: Response) => {
  return res.json(req.vigiaSession);
});

// ── Empresas ──────────────────────────────────────────────

// GET /api/vigia/empresas  (admin: todas; empresa: la propia)
vigiaRouter.get('/empresas', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  let query = db.from('vigia_empresas').select('id, nombre, nit, activa, creado_en, email_encargado, vigencia_meses, num_trabajadores, clase_riesgo, prefijo_docs');
  if (!sess.es_admin) query = query.eq('id', sess.empresa_id!);

  const { data, error } = await query.order('nombre');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/vigia/empresas  (admin only)
vigiaRouter.post('/empresas', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const { nombre, nit, password, email_encargado } = req.body as { nombre: string; nit?: string; password: string; email_encargado?: string };
  if (!nombre || !password) return res.status(400).json({ error: 'nombre y password requeridos' });

  const db = getDB();
  const { data, error } = await db
    .from('vigia_empresas')
    .insert({
      nombre:          nombre.trim(),
      nit:             nit?.trim() || null,
      password_hash:   hashPwd(password),
      email_encargado: email_encargado?.trim() || null,
      activa:          true,
    })
    .select('id, nombre, nit, activa, creado_en, email_encargado')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/empresas/:id/email  (admin only)
vigiaRouter.put('/empresas/:id/email', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const db = getDB();
  const { error } = await db
    .from('vigia_empresas')
    .update({ email_encargado: email?.trim() || null })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/empresas/:id/vigencia  (admin only)
vigiaRouter.put('/empresas/:id/vigencia', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const meses = parseInt(String(req.body.vigencia_meses));
  if (!meses || meses < 1 || meses > 36) {
    return res.status(400).json({ error: 'vigencia_meses debe ser entre 1 y 36' });
  }
  const db = getDB();
  const { error } = await db
    .from('vigia_empresas')
    .update({ vigencia_meses: meses })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/empresas/:id/password  (admin only)
vigiaRouter.put('/empresas/:id/password', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const { password } = req.body as { password: string };
  if (!password) return res.status(400).json({ error: 'password requerido' });

  const db = getDB();
  const { error } = await db
    .from('vigia_empresas')
    .update({ password_hash: hashPwd(password) })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/empresas/:id/configuracion
vigiaRouter.put('/empresas/:id/configuracion', vigiaAuth, async (req: Request, res: Response) => {
  const sess = req.vigiaSession!;
  const id   = req.params.id;
  if (!sess.es_admin && sess.empresa_id !== id) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const { num_trabajadores, clase_riesgo, ciiu, vigencia_docs_desde } = req.body as { num_trabajadores?: number; clase_riesgo?: string; ciiu?: string; vigencia_docs_desde?: string };
  const clasesValidas = ['I','II','III','IV','V'];
  if (clase_riesgo && !clasesValidas.includes(clase_riesgo)) {
    return res.status(400).json({ error: 'clase_riesgo debe ser I, II, III, IV o V' });
  }
  if (num_trabajadores !== undefined && (num_trabajadores < 1 || num_trabajadores > 99999)) {
    return res.status(400).json({ error: 'num_trabajadores debe ser un número válido' });
  }
  if (ciiu !== undefined && ciiu !== null && !/^\d{4}$/.test(ciiu)) {
    return res.status(400).json({ error: 'ciiu debe ser un código de 4 dígitos' });
  }
  const update: Record<string, unknown> = {};
  if (num_trabajadores   !== undefined) update.num_trabajadores   = Number(num_trabajadores);
  if (clase_riesgo       !== undefined) update.clase_riesgo       = clase_riesgo;
  if (ciiu               !== undefined) update.ciiu               = ciiu || null;
  if (vigencia_docs_desde !== undefined) update.vigencia_docs_desde = vigencia_docs_desde || null;
  if (!Object.keys(update).length) return res.status(400).json({ error: 'Nada que actualizar' });
  const db = getDB();
  const { error } = await db.from('vigia_empresas').update(update).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/empresas/:id/logo  (admin only)
vigiaRouter.put('/empresas/:id/logo', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const { datos_base64, tipo_mime, nombre_archivo } = req.body as { datos_base64: string; tipo_mime?: string; nombre_archivo?: string };
  if (!datos_base64) return res.status(400).json({ error: 'datos_base64 requerido' });

  const db = getDB();

  // Crear el bucket si no existe
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.find((b: { name: string }) => b.name === 'vigia-logos')) {
    const { error: bErr } = await db.storage.createBucket('vigia-logos', { public: true });
    if (bErr) return res.status(500).json({ error: 'No se pudo crear el bucket de logos: ' + bErr.message });
  }

  const ext = (nombre_archivo || 'logo.png').split('.').pop()?.toLowerCase() || 'png';
  const storagePath = `${req.params.id}/logo.${ext}`;
  const base64Data = datos_base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const { error: upErr } = await db.storage.from('vigia-logos').upload(storagePath, buffer, {
    contentType: tipo_mime || 'image/png', upsert: true,
  });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: urlData } = db.storage.from('vigia-logos').getPublicUrl(storagePath);
  const logo_url = urlData.publicUrl;

  await db.from('vigia_empresas').update({ logo_url }).eq('id', req.params.id);
  return res.json({ ok: true, logo_url });
});

// DELETE /api/vigia/empresas/:id/logo  (admin only)
vigiaRouter.delete('/empresas/:id/logo', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const db = getDB();
  // Intentar eliminar archivos del storage (ambas extensiones comunes)
  await db.storage.from('vigia-logos').remove([
    `${req.params.id}/logo.png`,
    `${req.params.id}/logo.jpg`,
    `${req.params.id}/logo.jpeg`,
  ]);
  await db.from('vigia_empresas').update({ logo_url: null }).eq('id', req.params.id);
  return res.json({ ok: true });
});

// PUT /api/vigia/empresas/:id/prefijo-docs  (admin only)
vigiaRouter.put('/empresas/:id/prefijo-docs', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const prefijo = String(req.body.prefijo_docs || '').trim().toUpperCase() || 'SG-SST';
  const db = getDB();
  const { error } = await db
    .from('vigia_empresas')
    .update({ prefijo_docs: prefijo })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, prefijo_docs: prefijo });
});

// PUT /api/vigia/empresas/:id/activa  (admin only)
vigiaRouter.put('/empresas/:id/activa', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const activa = Boolean(req.body.activa);
  const db = getDB();
  const { error } = await db.from('vigia_empresas').update({ activa }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/empresas/:id  (admin only) — elimina empresa y todos sus datos
vigiaRouter.delete('/empresas/:id', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const db = getDB();
  const id = req.params.id;

  // Eliminar en cascada (orden inverso de FKs)
  await db.from('vigia_examenes').delete().in('empleado_id',
    db.from('vigia_empleados').select('id').eq('empresa_id', id) as any
  );
  await Promise.all([
    db.from('vigia_empleados').delete().eq('empresa_id', id),
    db.from('vigia_evaluacion_sst').delete().eq('empresa_id', id),
    db.from('vigia_sesiones').delete().eq('empresa_id', id),
  ]);

  const { error } = await db.from('vigia_empresas').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// GET /api/vigia/admin/resumen  (admin only) — datos agregados de todas las empresas
vigiaRouter.get('/admin/resumen', vigiaAuth, vigiaAdminOnly, async (req: Request, res: Response) => {
  const db = getDB();

  const [{ data: empresas, error: eErr }, { data: evals }, { data: empleados }, { data: peligros }] =
    await Promise.all([
      db.from('vigia_empresas')
        .select('id, nombre, nit, activa, creado_en, email_encargado, vigencia_meses, num_trabajadores, clase_riesgo, ciiu, prefijo_docs, logo_url, vigencia_docs_desde')
        .order('nombre'),
      db.from('vigia_evaluacion_sst')
        .select('empresa_id, puntaje, categoria, periodo, creado_en')
        .order('creado_en', { ascending: false }),
      db.from('vigia_empleados').select('empresa_id').eq('activo', true),
      db.from('vigia_peligros').select('empresa_id'),
    ]);

  if (eErr) return res.status(500).json({ error: eErr.message });

  const lastEval = new Map<string, { puntaje: number | null; categoria: string | null; periodo: string | null; creado_en: string }>();
  for (const ev of (evals || [])) {
    if (!lastEval.has(ev.empresa_id)) {
      lastEval.set(ev.empresa_id, { puntaje: ev.puntaje, categoria: ev.categoria, periodo: ev.periodo, creado_en: ev.creado_en });
    }
  }

  const empCount  = new Map<string, number>();
  for (const e of (empleados || [])) empCount.set(e.empresa_id, (empCount.get(e.empresa_id) || 0) + 1);

  const pelCount  = new Map<string, number>();
  for (const p of (peligros  || [])) pelCount.set(p.empresa_id, (pelCount.get(p.empresa_id) || 0) + 1);

  return res.json((empresas || []).map(emp => ({
    ...emp,
    last_eval:       lastEval.get(emp.id) || null,
    empleados_count: empCount.get(emp.id)  || 0,
    peligros_count:  pelCount.get(emp.id)  || 0,
  })));
});

// ── Empleados ─────────────────────────────────────────────

// GET /api/vigia/empleados
vigiaRouter.get('/empleados', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  let query = db
    .from('vigia_empleados')
    .select(`
      id, empresa_id, cc, tipo_doc, nombre, fecha_nac, sexo, celular,
      eps, arl, fondo_pension, cargo, departamento, alerta_nivel, creado_en,
      vigia_empresas(nombre)
    `);

  if (!sess.es_admin) query = query.eq('empresa_id', sess.empresa_id!);

  const incluirInactivos = req.query.incluir_inactivos === 'true';
  if (!incluirInactivos) query = query.eq('activo', true);

  const { data, error } = await query.order('nombre');
  if (error) return res.status(500).json({ error: error.message });

  // Enriquecer con el último examen por empleado (tipo + SVEs) en una sola consulta
  const empIds = (data as any[]).map((e: any) => e.id);
  if (empIds.length > 0) {
    const { data: exams } = await db
      .from('vigia_examenes')
      .select('empleado_id, tipo, examenes_realizados, fecha, concepto_aptitud')
      .in('empleado_id', empIds)
      .order('fecha', { ascending: false });

    const ultimoExamen: Record<string, any> = {};
    for (const ex of (exams || [])) {
      if (!ultimoExamen[ex.empleado_id]) ultimoExamen[ex.empleado_id] = ex;
    }

    return res.json((data as any[]).map((e: any) => ({
      ...e,
      ultimo_examen: ultimoExamen[e.id] || null,
    })));
  }

  return res.json(data);
});

// GET /api/vigia/empleados/:id
vigiaRouter.get('/empleados/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  const { data: emp, error } = await db
    .from('vigia_empleados')
    .select(`*, vigia_empresas(nombre, prefijo_docs, vigencia_docs_desde)`)
    .eq('id', req.params.id)
    .single();

  if (error || !emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!sess.es_admin && emp.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso a este empleado' });
  }

  const { data: examenes } = await db
    .from('vigia_examenes')
    .select('*')
    .eq('empleado_id', emp.id)
    .order('fecha', { ascending: false });

  return res.json({ ...emp, examenes: examenes || [] });
});

// POST /api/vigia/empleados  (upsert por CC dentro de la empresa)
vigiaRouter.post('/empleados', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  const body = req.body as {
    cc: string; nombre: string; empresa_id?: string;
    tipo_doc?: string;
    fecha_nac?: string; sexo?: string; celular?: string;
    eps?: string; arl?: string; fondo_pension?: string;
    cargo?: string; departamento?: string;
  };

  const empresaId = sess.es_admin ? (body.empresa_id || sess.empresa_id) : sess.empresa_id;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  if (!body.cc || !body.nombre) return res.status(400).json({ error: 'cc y nombre requeridos' });

  const tiposDocValidos = ['CC', 'CE', 'PEP', 'Pasaporte', 'NIT'];
  const tipoDoc = body.tipo_doc && tiposDocValidos.includes(body.tipo_doc) ? body.tipo_doc : 'CC';

  const payload = {
    empresa_id:    empresaId,
    cc:            body.cc.trim(),
    tipo_doc:      tipoDoc,
    nombre:        body.nombre.trim(),
    fecha_nac:     body.fecha_nac || null,
    sexo:          body.sexo || null,
    celular:       body.celular || null,
    eps:           body.eps || null,
    arl:           body.arl || null,
    fondo_pension: body.fondo_pension || null,
    cargo:         body.cargo || null,
    departamento:  body.departamento || null,
    estado_civil:  (body as any).estado_civil || null,
    escolaridad:   (body as any).escolaridad || null,
  };

  const { data, error } = await db
    .from('vigia_empleados')
    .upsert(payload, { onConflict: 'empresa_id,cc' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/empleados/:id/alerta
vigiaRouter.put('/empleados/:id/alerta', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const { alerta_nivel } = req.body as { alerta_nivel: string };

  const { error } = await db
    .from('vigia_empleados')
    .update({ alerta_nivel })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/empleados/:id/estado
vigiaRouter.put('/empleados/:id/estado', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;
  const { activo } = req.body as { activo: boolean };

  const { data: emp } = await db
    .from('vigia_empleados')
    .select('empresa_id')
    .eq('id', req.params.id)
    .single();

  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!sess.es_admin && emp.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso' });
  }

  const { error } = await db
    .from('vigia_empleados')
    .update({ activo: activo !== false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/empleados/:id
vigiaRouter.delete('/empleados/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  const { data: emp } = await db
    .from('vigia_empleados')
    .select('empresa_id')
    .eq('id', req.params.id)
    .single();

  if (!emp) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && emp.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso' });
  }

  const { error } = await db.from('vigia_empleados').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ── Exámenes ──────────────────────────────────────────────

// GET /api/vigia/examenes/cobertura  — cobertura de exámenes por empleado
vigiaRouter.get('/examenes/cobertura', vigiaAuth, async (req: Request, res: Response) => {
  const db      = getDB();
  const sess    = req.vigiaSession!;
  const empId   = sess.es_admin ? (req.query.empresa_id as string) : sess.empresa_id!;
  if (!empId) return res.status(400).json({ error: 'empresa_id requerido' });

  const inclInactivos = req.query.incluir_inactivos === 'true';

  const empQuery = db
    .from('vigia_empleados')
    .select('id, cc, nombre, cargo, departamento, sexo, alerta_nivel, activo')
    .eq('empresa_id', empId)
    .order('nombre');
  if (!inclInactivos) empQuery.eq('activo', true);

  const { data: empleados, error: eErr } = await empQuery;
  if (eErr) return res.status(500).json({ error: eErr.message });
  if (!empleados?.length) return res.json([]);

  const ids = (empleados as any[]).map((e) => e.id);
  const { data: examenes, error: exErr } = await db
    .from('vigia_examenes')
    .select('empleado_id, tipo, fecha, concepto_aptitud, ips, alertas')
    .in('empleado_id', ids)
    .order('fecha', { ascending: false });
  if (exErr) return res.status(500).json({ error: exErr.message });

  // Último examen por empleado (ya vienen ordenados DESC)
  const ultimo: Record<string, any> = {};
  const conteo: Record<string, number> = {};
  for (const ex of (examenes || [])) {
    conteo[ex.empleado_id] = (conteo[ex.empleado_id] || 0) + 1;
    if (!ultimo[ex.empleado_id]) ultimo[ex.empleado_id] = ex;
  }

  const result = (empleados as any[]).map((emp) => ({
    id:            emp.id,
    cc:            emp.cc,
    nombre:        emp.nombre,
    cargo:         emp.cargo        || '',
    departamento:  emp.departamento || '',
    sexo:          emp.sexo         || '',
    alerta_nivel:  emp.alerta_nivel || 'OK',
    activo:        emp.activo,
    total_examenes: conteo[emp.id] || 0,
    tiene_examen:  !!ultimo[emp.id],
    ultimo_examen: ultimo[emp.id]
      ? {
          tipo:            ultimo[emp.id].tipo,
          fecha:           ultimo[emp.id].fecha,
          concepto_aptitud:ultimo[emp.id].concepto_aptitud,
          ips:             ultimo[emp.id].ips,
        }
      : null,
  }));

  return res.json(result);
});

// POST /api/vigia/examenes/bulk  — carga masiva desde CSV
vigiaRouter.post('/examenes/bulk', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const { empresa_id: bodyEmpresaId, examenes } = req.body as {
    empresa_id?: string;
    examenes: Array<{
      cedula: string; nombre?: string; cargo?: string;
      tipo: string; fecha: string; ips?: string; medico?: string;
      licencia_sst?: string; concepto_aptitud: string;
      examenes_realizados?: string[]; restricciones?: string[]; recomendaciones?: string[];
    }>;
  };

  const empresaId = sess.es_admin ? (bodyEmpresaId || null) : sess.empresa_id;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  if (!Array.isArray(examenes) || !examenes.length) {
    return res.status(400).json({ error: 'Se requiere al menos un examen' });
  }

  const resultados: object[] = [];

  for (const row of examenes) {
    try {
      if (!row.cedula) throw new Error('Cédula vacía');

      // Normalizar CC: solo dígitos (elimina puntos, espacios, guiones)
      const ccNorm = String(row.cedula).trim().replace(/\D/g, '');
      const ccRaw  = String(row.cedula).trim();
      if (!ccNorm) throw new Error(`Cédula inválida: "${row.cedula}"`);

      // Buscar por CC normalizado primero; si no hay, probar el raw (registros legacy con puntos)
      let { data: emp } = await db
        .from('vigia_empleados')
        .select('id, nombre, cc')
        .eq('cc', ccNorm)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (!emp && ccRaw !== ccNorm) {
        const { data: empRaw } = await db
          .from('vigia_empleados')
          .select('id, nombre, cc')
          .eq('cc', ccRaw)
          .eq('empresa_id', empresaId)
          .maybeSingle();
        emp = empRaw;
      }

      if (!emp) {
        if (!row.nombre) throw new Error(`Empleado CC ${row.cedula} no encontrado y columna "nombre" vacía`);
        const { data: newEmp, error: empErr } = await db
          .from('vigia_empleados')
          .insert({ cc: ccNorm, nombre: row.nombre.trim(),
                    empresa_id: empresaId, cargo: row.cargo || null, activo: true })
          .select('id, nombre, cc').single();
        if (empErr) throw new Error(empErr.message);
        emp = newEmp;
      }

      // Alertas básicas
      const alertas: object[] = [];
      const aptitud = (row.concepto_aptitud || '').toUpperCase();
      if (aptitud === 'NO APTO') {
        alertas.push({ tipo: 'CONCEPTO', nivel: 'CRITICO', mensaje: 'Concepto: NO APTO' });
      } else if (aptitud.startsWith('APTO CON')) {
        alertas.push({ tipo: 'CONCEPTO', nivel: 'ADVERTENCIA', mensaje: 'Concepto: APTO CON RESTRICCIÓN' });
      }
      if (row.fecha && row.tipo === 'PERIODICO') {
        const dias = Math.floor((Date.now() - new Date(row.fecha).getTime()) / 86400000);
        if (dias > 365) alertas.push({ tipo: 'VENCIMIENTO', nivel: 'CRITICO',   mensaje: `Examen vencido (${dias} días)` });
        else if (dias > 300) alertas.push({ tipo: 'VENCIMIENTO', nivel: 'ADVERTENCIA', mensaje: `Por vencer (${dias} días)` });
      }

      const { error: exErr } = await db.from('vigia_examenes').insert({
        empleado_id:         emp.id,
        tipo:                row.tipo || 'PERIODICO',
        fecha:               row.fecha,
        ips:                 row.ips || null,
        medico:              row.medico || null,
        licencia_sst:        row.licencia_sst || null,
        concepto_aptitud:    row.concepto_aptitud || 'PENDIENTE',
        examenes_realizados: row.examenes_realizados || [],
        restricciones:       row.restricciones || [],
        recomendaciones:     row.recomendaciones || [],
        alertas,
      });
      if (exErr) throw new Error(exErr.message);

      // Recalcular alerta_nivel del empleado
      const { data: todos } = await db.from('vigia_examenes').select('alertas').eq('empleado_id', emp.id);
      const allAlertas = (todos || []).flatMap((e: any) => e.alertas || []);
      const nivel = allAlertas.some((a: any) => a.nivel === 'CRITICO')     ? 'CRITICO'
                  : allAlertas.some((a: any) => a.nivel === 'ADVERTENCIA') ? 'ADVERTENCIA'
                  : 'OK';
      await db.from('vigia_empleados').update({ alerta_nivel: nivel }).eq('id', emp.id);

      resultados.push({ cedula: emp.cc, nombre: emp.nombre, ok: true, empleado_id: emp.id, alertas: alertas.length });
    } catch (e: any) {
      resultados.push({ cedula: row.cedula, ok: false, error: e.message });
    }
  }

  return res.json(resultados);
});

// POST /api/vigia/examenes
vigiaRouter.post('/examenes', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  const body = req.body as {
    empleado_id: string;
    tipo: string; fecha: string; ips?: string; medico?: string;
    licencia_sst?: string; concepto_aptitud: string;
    examenes_realizados?: string[]; restricciones?: string[];
    recomendaciones?: string[]; alertas?: object[]; pdf_nombre?: string;
  };

  if (!body.ips?.trim())   return res.status(400).json({ error: 'El nombre de la IPS es obligatorio' });
  if (!body.medico?.trim()) return res.status(400).json({ error: 'El nombre del médico es obligatorio' });

  // Verificar acceso al empleado
  const { data: emp } = await db
    .from('vigia_empleados')
    .select('empresa_id')
    .eq('id', body.empleado_id)
    .single();

  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!sess.es_admin && emp.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso a este empleado' });
  }

  const { data, error } = await db
    .from('vigia_examenes')
    .insert({
      empleado_id:         body.empleado_id,
      tipo:                body.tipo,
      fecha:               body.fecha,
      ips:                 body.ips || null,
      medico:              body.medico || null,
      licencia_sst:        body.licencia_sst || null,
      concepto_aptitud:    body.concepto_aptitud,
      examenes_realizados: body.examenes_realizados || [],
      restricciones:       body.restricciones || [],
      recomendaciones:     body.recomendaciones || [],
      alertas:             body.alertas || [],
      pdf_nombre:          body.pdf_nombre || null,
      fumador:                  (body as any).fumador ?? null,
      consume_licor:            (body as any).consume_licor ?? null,
      practica_deporte:         (body as any).practica_deporte ?? null,
      audiometria:              (body as any).audiometria || null,
      visiometria:              (body as any).visiometria || null,
      espirometria:             (body as any).espirometria || null,
      osteomuscular:            (body as any).osteomuscular || null,
      diagnostico_clinico:      (body as any).diagnostico_clinico || null,
      restriccion_temporalidad: (body as any).restriccion_temporalidad || null,
      restriccion_hasta:        (body as any).restriccion_hasta || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Recalcular alerta_nivel del empleado
  const { data: todosExamenes } = await db
    .from('vigia_examenes')
    .select('alertas')
    .eq('empleado_id', body.empleado_id);

  const todasAlertas = (todosExamenes || []).flatMap((e: any) => e.alertas || []);
  const nivel = todasAlertas.some((a: any) => a.nivel === 'CRITICO')     ? 'CRITICO'
              : todasAlertas.some((a: any) => a.nivel === 'ADVERTENCIA') ? 'ADVERTENCIA'
              : todasAlertas.some((a: any) => a.nivel === 'SEGUIMIENTO') ? 'SEGUIMIENTO'
              : 'OK';

  await db.from('vigia_empleados').update({ alerta_nivel: nivel }).eq('id', body.empleado_id);

  return res.status(201).json(data);
});

// DELETE /api/vigia/examenes/:id
vigiaRouter.delete('/examenes/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const { error } = await db.from('vigia_examenes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/examenes/:id
vigiaRouter.put('/examenes/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  const body = req.body as {
    tipo?: string; fecha?: string; ips?: string; medico?: string;
    licencia_sst?: string; concepto_aptitud?: string;
    examenes_realizados?: string[]; restricciones?: string[];
    recomendaciones?: string[]; alertas?: object[];
    restriccion_temporalidad?: string; restriccion_hasta?: string;
  };

  if (body.ips !== undefined && !body.ips?.trim())    return res.status(400).json({ error: 'El nombre de la IPS es obligatorio' });
  if (body.medico !== undefined && !body.medico?.trim()) return res.status(400).json({ error: 'El nombre del médico es obligatorio' });

  const { data: examen } = await db
    .from('vigia_examenes')
    .select('empleado_id')
    .eq('id', req.params.id)
    .single();

  if (!examen) return res.status(404).json({ error: 'Examen no encontrado' });

  const { data: emp } = await db
    .from('vigia_empleados')
    .select('empresa_id')
    .eq('id', examen.empleado_id)
    .single();

  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!sess.es_admin && emp.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso' });
  }

  const { data, error } = await db
    .from('vigia_examenes')
    .update({
      tipo:                     body.tipo,
      fecha:                    body.fecha,
      ips:                      body.ips || null,
      medico:                   body.medico || null,
      licencia_sst:             body.licencia_sst || null,
      concepto_aptitud:         body.concepto_aptitud,
      examenes_realizados:      body.examenes_realizados || [],
      restricciones:            body.restricciones || [],
      recomendaciones:          body.recomendaciones || [],
      alertas:                  body.alertas || [],
      restriccion_temporalidad: body.restriccion_temporalidad || null,
      restriccion_hasta:        body.restriccion_hasta || null,
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Recalcular alerta_nivel del empleado
  const { data: todosExamenes } = await db
    .from('vigia_examenes')
    .select('alertas')
    .eq('empleado_id', examen.empleado_id);

  const todasAlertas = (todosExamenes || []).flatMap((e: any) => e.alertas || []);
  const nivel = todasAlertas.some((a: any) => a.nivel === 'CRITICO')     ? 'CRITICO'
              : todasAlertas.some((a: any) => a.nivel === 'ADVERTENCIA') ? 'ADVERTENCIA'
              : todasAlertas.some((a: any) => a.nivel === 'SEGUIMIENTO') ? 'SEGUIMIENTO'
              : 'OK';

  await db.from('vigia_empleados').update({ alerta_nivel: nivel }).eq('id', examen.empleado_id);

  return res.json(data);
});

// ── Stats ─────────────────────────────────────────────────

// ── Recuperación de contraseña ────────────────────────────

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 3)}***@${domain}`;
}

// POST /api/vigia/recuperar-password  (sin auth)
vigiaRouter.post('/recuperar-password', async (req: Request, res: Response) => {
  const { nombre } = req.body as { nombre: string };
  if (!nombre) return res.status(400).json({ error: 'Nombre de empresa requerido' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(503).json({ error: 'Servicio de correo no configurado' });

  const db = getDB();
  const { data: empresa } = await db
    .from('vigia_empresas')
    .select('id, nombre, email_encargado')
    .ilike('nombre', nombre.trim())
    .eq('activa', true)
    .single();

  if (!empresa?.email_encargado) {
    return res.json({
      mensaje: empresa
        ? `Esta empresa no tiene correo registrado. Contacta al administrador: consultoria@forbesas.com`
        : 'Si el nombre es correcto y tienes correo registrado, recibirás el enlace en breve.',
      sin_correo: !empresa?.email_encargado,
    });
  }

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db.from('vigia_empresas').update({
    recovery_token:   token,
    recovery_expires: expires.toISOString(),
  }).eq('id', empresa.id);

  const link = `https://riesgo-backend-production.up.railway.app/vigia/reset-password.html?token=${token}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
    <div style="background:#1A3A5C;padding:28px 32px;border-radius:8px 8px 0 0">
      <h1 style="color:white;margin:0;font-size:20px">🛡️ VIGÍA SST</h1>
      <p style="color:#CBD8E6;margin:6px 0 0;font-size:14px">Restablecimiento de contraseña</p>
    </div>
    <div style="background:#fff;border:1px solid #ddd;border-top:none;padding:32px;border-radius:0 0 8px 8px">
      <p>Hola, recibimos una solicitud para restablecer la contraseña de <strong>${empresa.nombre}</strong> en Vigía SST.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${link}" style="background:#2E86AB;color:white;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block">
          Restablecer contraseña →
        </a>
      </div>
      <p style="font-size:13px;color:#888">Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo — tu contraseña actual no cambiará.</p>
      <p style="font-size:12px;color:#aaa;margin-top:20px;border-top:1px solid #eee;padding-top:12px">
        Si el botón no funciona, copia este enlace en tu navegador:<br>
        <a href="${link}" style="color:#2E86AB;word-break:break-all">${link}</a>
      </p>
    </div>
  </body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Vigía SST <onboarding@resend.dev>',
      to:      empresa.email_encargado,
      subject: '🔑 Restablece tu contraseña — Vigía SST',
      html,
    }),
  });

  return res.json({ mensaje: `Enviamos el enlace a ${maskEmail(empresa.email_encargado)}. Revisa tu bandeja de entrada (y la carpeta de spam).` });
});

// GET /api/vigia/verificar-token  (sin auth)
vigiaRouter.get('/verificar-token', async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.json({ valido: false });

  const db = getDB();
  const { data } = await db
    .from('vigia_empresas')
    .select('nombre, recovery_expires')
    .eq('recovery_token', token)
    .single();

  if (!data) return res.json({ valido: false });
  if (new Date(data.recovery_expires) < new Date()) return res.json({ valido: false, expirado: true });
  return res.json({ valido: true, empresa: data.nombre });
});

// POST /api/vigia/reset-password  (sin auth)
vigiaRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });

  const db = getDB();
  const { data: empresa } = await db
    .from('vigia_empresas')
    .select('id, recovery_expires')
    .eq('recovery_token', token)
    .single();

  if (!empresa) return res.status(400).json({ error: 'Enlace inválido o ya utilizado' });
  if (new Date(empresa.recovery_expires) < new Date()) return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo desde el login.' });

  const { error } = await db.from('vigia_empresas').update({
    password_hash:    hashPwd(password),
    recovery_token:   null,
    recovery_expires: null,
  }).eq('id', empresa.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// POST /api/vigia/alertas-email  (resumen semanal — protegido por CRON_SECRET opcional)
vigiaRouter.post('/alertas-email', async (req: Request, res: Response) => {
  // Protección con clave secreta (si está configurada)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = (req.headers['x-cron-secret'] as string) || req.body?.secret;
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Clave secreta incorrecta' });
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(503).json({ error: 'RESEND_API_KEY no configurada' });

  const db  = getDB();
  const hoy = new Date();

  const { data: empresas } = await db
    .from('vigia_empresas')
    .select('id, nombre, email_encargado, vigencia_meses')
    .not('email_encargado', 'is', null)
    .neq('email_encargado', '')
    .eq('activa', true);

  if (!empresas?.length) return res.json({ ok: true, mensaje: 'Sin empresas con correo configurado' });

  const resultados: object[] = [];

  for (const empresa of (empresas as any[])) {
    const vigenciaMeses: number = empresa.vigencia_meses || 12;

    const { data: examenes } = await db
      .from('vigia_examenes')
      .select('fecha, tipo, vigia_empleados!inner(nombre, cc, cargo, empresa_id)')
      .eq('vigia_empleados.empresa_id', empresa.id)
      .not('tipo', 'in', '("RETIRO","EGRESO")');

    if (!examenes?.length) { resultados.push({ empresa: empresa.nombre, omitido: 'sin exámenes' }); continue; }

    // Calcula la fecha de vencimiento respetando la vigencia configurada por empresa
    // (SEGUIMIENTO usa 6 meses fijos; los demás usan vigencia_meses de la empresa)
    const calcVence = (ex: any): Date => {
      const v = new Date(ex.fecha + 'T00:00:00');
      const m = ex.tipo === 'SEGUIMIENTO' ? 6 : vigenciaMeses;
      v.setMonth(v.getMonth() + m);
      return v;
    };

    const porVencer = (examenes as any[]).filter(ex => {
      const dias = Math.round((calcVence(ex).getTime() - hoy.getTime()) / 86400000);
      return dias <= 60;
    });

    if (!porVencer.length) { resultados.push({ empresa: empresa.nombre, omitido: 'todos al día' }); continue; }

    const vencidos = porVencer.filter(ex => calcVence(ex) < hoy).length;
    const proximos = porVencer.length - vencidos;

    const filas = porVencer.map((ex: any) => {
      const emp   = ex.vigia_empleados;
      const dias  = Math.round((calcVence(ex).getTime() - hoy.getTime()) / 86400000);
      const color = dias < 0 ? '#E74C3C' : dias <= 30 ? '#E67E22' : '#F39C12';
      const label = dias < 0
        ? `VENCIDO hace ${Math.abs(dias)} días`
        : `Vence en ${dias} días`;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${emp.nombre}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${emp.cc}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${emp.cargo || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${ex.tipo}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${ex.fecha}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${color};font-weight:700">${label}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#333">
      <div style="background:#1A3A5C;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">🛡️ VIGÍA SST — Resumen semanal</h1>
        <p style="color:#CBD8E6;margin:6px 0 0;font-size:14px">${empresa.nombre}</p>
      </div>
      <div style="background:#fff;border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="margin-top:0">Esta semana hay <strong>${porVencer.length} examen(es)</strong> que requieren atención:</p>
        ${vencidos > 0 ? `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:12px;margin-bottom:12px">
          🔴 <strong>${vencidos} examen(es) VENCIDO(S)</strong> — requieren renovación inmediata.
        </div>` : ''}
        ${proximos > 0 ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:12px;margin-bottom:16px">
          🟡 <strong>${proximos} examen(es) próximo(s) a vencer</strong> en los próximos 60 días.
        </div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#F0F4F8">
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">Empleado</th>
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">CC</th>
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">Cargo</th>
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">Tipo</th>
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">Fecha examen</th>
            <th style="padding:10px 12px;text-align:left;color:#1A3A5C">Estado</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="https://riesgo-backend-production.up.railway.app/vigia/dashboard.html"
             style="background:#1A3A5C;color:white;padding:12px 28px;border-radius:6px;
                    text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
            Ver en Vigía SST →
          </a>
        </div>
        <p style="margin-top:20px;font-size:11px;color:#aaa;text-align:center">
          Resumen automático semanal · Vigía SST · Res. 1843/2025<br>
          Para dejar de recibir este correo, contacta al administrador del sistema.
        </p>
      </div>
    </body></html>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Vigía SST <onboarding@resend.dev>',
        to:      empresa.email_encargado,
        subject: `🛡️ Vigía — Resumen semanal${vencidos > 0 ? ` ⚠️ ${vencidos} vencido(s)` : ''}: ${empresa.nombre}`,
        html,
      }),
    });
    resultados.push({ empresa: empresa.nombre, enviado: r.ok, vencidos, proximos });
  }

  return res.json({ ok: true, resultados });
});

// GET /api/vigia/informe-condiciones
vigiaRouter.get('/informe-condiciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string)
    : sess.empresa_id!;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data: empresa } = await db
    .from('vigia_empresas').select('nombre, nit').eq('id', empresaId).single();

  const { data: empleados, error: empErr } = await db
    .from('vigia_empleados')
    .select('id, nombre, sexo, fecha_nac, cargo, estado_civil, escolaridad, arl, eps, alerta_nivel')
    .eq('empresa_id', empresaId);

  if (empErr) return res.status(500).json({ error: empErr.message });
  if (!empleados?.length) return res.json({ empresa, total_empleados: 0, stats: null });

  const empIds = empleados.map((e: any) => e.id);

  const { data: examenes } = await db
    .from('vigia_examenes')
    .select('empleado_id, tipo, fecha, ips, concepto_aptitud, recomendaciones, fumador, consume_licor, practica_deporte, audiometria, visiometria, espirometria, osteomuscular, diagnostico_clinico')
    .in('empleado_id', empIds)
    .order('fecha', { ascending: false });

  const exList = examenes || [];

  // Most recent exam per employee
  const mapaUltimo = new Map<string, any>();
  for (const ex of exList) {
    if (!mapaUltimo.has(ex.empleado_id)) mapaUltimo.set(ex.empleado_id, ex);
  }
  const ultimosExamenes = [...mapaUltimo.values()];

  const hoy = new Date();
  const cnt = (arr: any[], fn: (x: any) => boolean) => arr.filter(fn).length;

  // Género
  const sexo = {
    masculino: cnt(empleados, e => (e.sexo || '').toUpperCase() === 'MASCULINO'),
    femenino:  cnt(empleados, e => (e.sexo || '').toUpperCase() === 'FEMENINO'),
    otro:      cnt(empleados, e => e.sexo && !['MASCULINO','FEMENINO'].includes(e.sexo.toUpperCase())),
  };

  // Grupos de edad
  const grupos_edad: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0, 'Sin fecha': 0 };
  for (const emp of empleados) {
    if (!emp.fecha_nac) { grupos_edad['Sin fecha']++; continue; }
    const edad = Math.floor((hoy.getTime() - new Date(emp.fecha_nac + 'T00:00:00').getTime()) / (365.25 * 86400000));
    if (edad <= 25) grupos_edad['18-25']++;
    else if (edad <= 35) grupos_edad['26-35']++;
    else if (edad <= 45) grupos_edad['36-45']++;
    else if (edad <= 55) grupos_edad['46-55']++;
    else grupos_edad['56+']++;
  }

  // Tipos de examen (todos los registros)
  const tipos_examen: Record<string, number> = {};
  for (const ex of exList) {
    tipos_examen[ex.tipo] = (tipos_examen[ex.tipo] || 0) + 1;
  }

  // Concepto de aptitud (último examen por empleado)
  const conceptos: Record<string, number> = {};
  for (const ex of ultimosExamenes) {
    const c = ex.concepto_aptitud || 'SIN CONCEPTO';
    conceptos[c] = (conceptos[c] || 0) + 1;
  }

  // IPS
  const ips_count: Record<string, number> = {};
  for (const ex of exList) {
    if (ex.ips) ips_count[ex.ips] = (ips_count[ex.ips] || 0) + 1;
  }

  // Cargos
  const cargos: Record<string, number> = {};
  for (const emp of empleados) {
    if (emp.cargo) cargos[emp.cargo] = (cargos[emp.cargo] || 0) + 1;
  }

  // Estado civil y escolaridad
  const estado_civil: Record<string, number> = {};
  const escolaridad: Record<string, number> = {};
  for (const emp of empleados) {
    if (emp.estado_civil) estado_civil[emp.estado_civil] = (estado_civil[emp.estado_civil] || 0) + 1;
    if (emp.escolaridad)  escolaridad[emp.escolaridad]   = (escolaridad[emp.escolaridad] || 0) + 1;
  }

  // Alertas
  const alertas = {
    critico:     cnt(empleados, e => e.alerta_nivel === 'CRITICO'),
    advertencia: cnt(empleados, e => e.alerta_nivel === 'ADVERTENCIA'),
    seguimiento: cnt(empleados, e => e.alerta_nivel === 'SEGUIMIENTO'),
    ok:          cnt(empleados, e => e.alerta_nivel === 'OK'),
  };

  // Hábitos (solo los que tienen dato)
  const conHabitos = ultimosExamenes.filter(e => e.fumador !== null || e.consume_licor !== null || e.practica_deporte !== null);
  const habitos = {
    n:                conHabitos.length,
    fumadores:        cnt(conHabitos, e => e.fumador === true),
    no_fumadores:     cnt(conHabitos, e => e.fumador === false),
    consume_licor:    cnt(conHabitos, e => e.consume_licor === true),
    no_licor:         cnt(conHabitos, e => e.consume_licor === false),
    practica_deporte: cnt(conHabitos, e => e.practica_deporte === true),
    no_deporte:       cnt(conHabitos, e => e.practica_deporte === false),
  };

  // Exámenes complementarios
  const complementarios = {
    audiometria:  { normal: cnt(ultimosExamenes, e => e.audiometria === 'normal'),  alterada: cnt(ultimosExamenes, e => e.audiometria === 'alterada'),  n: cnt(ultimosExamenes, e => e.audiometria === 'normal' || e.audiometria === 'alterada') },
    visiometria:  { normal: cnt(ultimosExamenes, e => e.visiometria === 'normal'),  alterada: cnt(ultimosExamenes, e => e.visiometria === 'alterada'),  n: cnt(ultimosExamenes, e => e.visiometria === 'normal' || e.visiometria === 'alterada') },
    espirometria: { normal: cnt(ultimosExamenes, e => e.espirometria === 'normal'), alterada: cnt(ultimosExamenes, e => e.espirometria === 'alterada'), n: cnt(ultimosExamenes, e => e.espirometria === 'normal' || e.espirometria === 'alterada') },
    osteomuscular:{ normal: cnt(ultimosExamenes, e => e.osteomuscular === 'normal'),alterada: cnt(ultimosExamenes, e => e.osteomuscular === 'alterado'),n: cnt(ultimosExamenes, e => e.osteomuscular === 'normal' || e.osteomuscular === 'alterado') },
  };

  // Recomendaciones más frecuentes
  const recMap: Record<string, number> = {};
  for (const ex of exList) {
    for (const r of (ex.recomendaciones || [])) {
      if (r) recMap[r] = (recMap[r] || 0) + 1;
    }
  }
  const top_recomendaciones = Object.entries(recMap)
    .sort(([,a],[,b]) => b - a).slice(0, 12)
    .map(([rec, n]) => ({ rec, n }));

  // Período
  const fechas = exList.map((e: any) => e.fecha).filter(Boolean).sort();
  const periodo = { desde: fechas[0] || null, hasta: fechas[fechas.length - 1] || null };

  return res.json({
    empresa,
    periodo,
    total_empleados: empleados.length,
    total_examenes:  exList.length,
    sexo,
    grupos_edad,
    estado_civil,
    escolaridad,
    tipos_examen,
    conceptos,
    alertas,
    ips_count,
    cargos,
    habitos,
    complementarios,
    top_recomendaciones,
  });
});

// ── Matriz de Peligros SG-SST (GTC-45) ───────────────────

// GET /api/vigia/peligros
vigiaRouter.get('/peligros', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const empresaId = sess.es_admin
    ? ((req.query.empresa_id as string) || null)
    : sess.empresa_id;

  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data, error } = await db
    .from('vigia_peligros')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('proceso')
    .order('creado_en');

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/vigia/peligros
vigiaRouter.post('/peligros', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const body = req.body as any;

  const empresaId = sess.es_admin ? (body.empresa_id || sess.empresa_id) : sess.empresa_id;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data, error } = await db
    .from('vigia_peligros')
    .insert({
      empresa_id:           empresaId,
      proceso:              body.proceso              || null,
      zona:                 body.zona                || null,
      actividad_tipo:       body.actividad_tipo       || null,
      tarea:                body.tarea               || null,
      peligro_clase:        body.peligro_clase        || null,
      peligro_descripcion:  body.peligro_descripcion  || null,
      efectos_posibles:     body.efectos_posibles     || null,
      control_fuente:       body.control_fuente       || null,
      control_medio:        body.control_medio        || null,
      control_individuo:    body.control_individuo    || null,
      nivel_deficiencia:    body.nivel_deficiencia    ? parseInt(body.nivel_deficiencia)  : null,
      nivel_exposicion:     body.nivel_exposicion     ? parseInt(body.nivel_exposicion)   : null,
      nivel_consecuencia:   body.nivel_consecuencia   ? parseInt(body.nivel_consecuencia) : null,
      medida_eliminacion:   body.medida_eliminacion   || null,
      medida_sustitucion:   body.medida_sustitucion   || null,
      medida_ingenieria:    body.medida_ingenieria    || null,
      medida_administrativa: body.medida_administrativa || null,
      medida_epp:           body.medida_epp           || null,
      responsable:          body.responsable          || null,
      fecha_implementacion: body.fecha_implementacion || null,
      estado:               body.estado               || 'PENDIENTE',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/peligros/:id
vigiaRouter.put('/peligros/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const body = req.body as any;

  const { data: existing } = await db
    .from('vigia_peligros')
    .select('empresa_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Peligro no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso' });
  }

  const { data, error } = await db
    .from('vigia_peligros')
    .update({
      proceso:              body.proceso              || null,
      zona:                 body.zona                || null,
      actividad_tipo:       body.actividad_tipo       || null,
      tarea:                body.tarea               || null,
      peligro_clase:        body.peligro_clase        || null,
      peligro_descripcion:  body.peligro_descripcion  || null,
      efectos_posibles:     body.efectos_posibles     || null,
      control_fuente:       body.control_fuente       || null,
      control_medio:        body.control_medio        || null,
      control_individuo:    body.control_individuo    || null,
      nivel_deficiencia:    body.nivel_deficiencia    ? parseInt(body.nivel_deficiencia)  : null,
      nivel_exposicion:     body.nivel_exposicion     ? parseInt(body.nivel_exposicion)   : null,
      nivel_consecuencia:   body.nivel_consecuencia   ? parseInt(body.nivel_consecuencia) : null,
      medida_eliminacion:   body.medida_eliminacion   || null,
      medida_sustitucion:   body.medida_sustitucion   || null,
      medida_ingenieria:    body.medida_ingenieria    || null,
      medida_administrativa: body.medida_administrativa || null,
      medida_epp:           body.medida_epp           || null,
      responsable:          body.responsable          || null,
      fecha_implementacion: body.fecha_implementacion || null,
      estado:               body.estado               || 'PENDIENTE',
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ── Evaluación inicial SG-SST (Res. 0312/2019) ───────────

// GET /api/vigia/evaluaciones
vigiaRouter.get('/evaluaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? ((req.query.empresa_id as string) || null)
    : sess.empresa_id;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  const { data, error } = await db
    .from('vigia_evaluacion_sst')
    .select('id, empresa_id, periodo, evaluador, puntaje, categoria, creado_en')
    .eq('empresa_id', empresaId)
    .order('creado_en', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// GET /api/vigia/evaluaciones/:id
vigiaRouter.get('/evaluaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data, error } = await db
    .from('vigia_evaluacion_sst')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!sess.es_admin && data.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  return res.json(data);
});

// POST /api/vigia/evaluaciones
vigiaRouter.post('/evaluaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const body = req.body as any;
  const empresaId = sess.es_admin ? (body.empresa_id || sess.empresa_id) : sess.empresa_id;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  const { data, error } = await db
    .from('vigia_evaluacion_sst')
    .insert({
      empresa_id: empresaId,
      periodo:    body.periodo    || null,
      evaluador:  body.evaluador  || null,
      resultados: body.resultados || {},
      puntaje:    body.puntaje    ?? null,
      categoria:  body.categoria  || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/evaluaciones/:id
vigiaRouter.put('/evaluaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const body = req.body as any;
  const { data: existing } = await db
    .from('vigia_evaluacion_sst').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { data, error } = await db
    .from('vigia_evaluacion_sst')
    .update({
      periodo:    body.periodo    || null,
      evaluador:  body.evaluador  || null,
      resultados: body.resultados || {},
      puntaje:    body.puntaje    ?? null,
      categoria:  body.categoria  || null,
    })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/evaluaciones/:id
vigiaRouter.delete('/evaluaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_evaluacion_sst').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_evaluacion_sst').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ── Evidencias SG-SST ─────────────────────────────────────

// GET /api/vigia/evaluaciones/:id/evidencias
vigiaRouter.get('/evaluaciones/:id/evidencias', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ev } = await db.from('vigia_evaluacion_sst').select('empresa_id').eq('id', req.params.id).single();
  if (!ev) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!sess.es_admin && ev.empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });

  const { data, error } = await db
    .from('vigia_evidencias')
    .select('id, criterio, nombre_archivo, storage_path, tipo_mime, tamano_bytes, creado_en')
    .eq('evaluacion_id', req.params.id)
    .order('creado_en');
  if (error) return res.status(500).json({ error: error.message });

  const items = await Promise.all((data || []).map(async item => {
    const { data: signed } = await db.storage.from('vigia-evidencias').createSignedUrl(item.storage_path, 3600);
    return { ...item, url_descarga: signed?.signedUrl || null };
  }));
  return res.json(items);
});

// POST /api/vigia/evaluaciones/:id/evidencias
vigiaRouter.post('/evaluaciones/:id/evidencias', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { criterio, nombre_archivo, tipo_mime, datos_base64 } = req.body as {
    criterio: string; nombre_archivo: string; tipo_mime: string; datos_base64: string;
  };
  if (!criterio || !nombre_archivo || !datos_base64) {
    return res.status(400).json({ error: 'criterio, nombre_archivo y datos_base64 son requeridos' });
  }
  const { data: ev } = await db.from('vigia_evaluacion_sst').select('empresa_id').eq('id', req.params.id).single();
  if (!ev) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!sess.es_admin && ev.empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });

  const rawBase64 = datos_base64.replace(/^data:[^;]+;base64,/, '');
  const buffer    = Buffer.from(rawBase64, 'base64');
  if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'El archivo supera 10 MB' });

  const ext         = nombre_archivo.split('.').pop()?.toLowerCase() || 'bin';
  const safeName    = `${Date.now()}.${ext}`;
  const storagePath = `${ev.empresa_id}/${req.params.id}/${criterio.replace(/\./g, '_')}/${safeName}`;

  const { error: uploadErr } = await db.storage
    .from('vigia-evidencias')
    .upload(storagePath, buffer, { contentType: tipo_mime || 'application/octet-stream', upsert: false });
  if (uploadErr) return res.status(500).json({ error: uploadErr.message });

  const { data: record, error: dbErr } = await db
    .from('vigia_evidencias')
    .insert({ evaluacion_id: req.params.id, empresa_id: ev.empresa_id, criterio, nombre_archivo, storage_path: storagePath, tipo_mime: tipo_mime || null, tamano_bytes: buffer.length })
    .select().single();
  if (dbErr) {
    await db.storage.from('vigia-evidencias').remove([storagePath]);
    return res.status(500).json({ error: dbErr.message });
  }
  const { data: signed } = await db.storage.from('vigia-evidencias').createSignedUrl(storagePath, 3600);
  return res.status(201).json({ ...record, url_descarga: signed?.signedUrl || null });
});

// DELETE /api/vigia/evidencias/:id
vigiaRouter.delete('/evidencias/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ev, error: getErr } = await db
    .from('vigia_evidencias').select('empresa_id, storage_path').eq('id', req.params.id).single();
  if (getErr || !ev) return res.status(404).json({ error: 'Evidencia no encontrada' });
  if (!sess.es_admin && ev.empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  await db.storage.from('vigia-evidencias').remove([ev.storage_path]);
  const { error } = await db.from('vigia_evidencias').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/peligros/:id
vigiaRouter.delete('/peligros/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const { data: existing } = await db
    .from('vigia_peligros')
    .select('empresa_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Peligro no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id) {
    return res.status(403).json({ error: 'Sin acceso' });
  }

  const { error } = await db.from('vigia_peligros').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// PLAN DE TRABAJO ANUAL SST (Decreto 1072 Art. 2.2.4.6.22)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/plan-trabajo  — lista planes de la empresa (o todos si admin)
vigiaRouter.get('/plan-trabajo', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined)
    : sess.empresa_id!;

  let query = db
    .from('vigia_plan_trabajo')
    .select('*')
    .order('periodo', { ascending: false });

  if (empresaId) query = query.eq('empresa_id', empresaId);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/vigia/plan-trabajo  — crear nuevo plan
vigiaRouter.post('/plan-trabajo', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { periodo, responsable, estado } = req.body as {
    periodo: number; responsable?: string; estado?: string;
  };
  if (!periodo) return res.status(400).json({ error: 'periodo requerido' });

  const empresa_id = sess.es_admin
    ? (req.body.empresa_id || sess.empresa_id)
    : sess.empresa_id!;

  const { data, error } = await db
    .from('vigia_plan_trabajo')
    .insert({ empresa_id, periodo, responsable: responsable || null, estado: estado || 'activo' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/plan-trabajo/:id  — actualizar cabecera del plan
vigiaRouter.put('/plan-trabajo/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_plan_trabajo').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Plan no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const { periodo, responsable, estado } = req.body as {
    periodo?: number; responsable?: string; estado?: string;
  };
  const updates: Record<string, unknown> = {};
  if (periodo    !== undefined) updates.periodo      = periodo;
  if (responsable!== undefined) updates.responsable  = responsable;
  if (estado     !== undefined) updates.estado        = estado;

  const { data, error } = await db
    .from('vigia_plan_trabajo').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/plan-trabajo/:id
vigiaRouter.delete('/plan-trabajo/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_plan_trabajo').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Plan no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_plan_trabajo').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// GET /api/vigia/plan-actividades?plan_id=xxx  — listar actividades de un plan
vigiaRouter.get('/plan-actividades', vigiaAuth, async (req: Request, res: Response) => {
  const db      = getDB();
  const sess    = req.vigiaSession!;
  const planId  = req.query.plan_id as string;
  if (!planId) return res.status(400).json({ error: 'plan_id requerido' });

  // Verificar acceso al plan
  const { data: plan } = await db
    .from('vigia_plan_trabajo').select('empresa_id').eq('id', planId).single();
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
  if (!sess.es_admin && plan.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const { data, error } = await db
    .from('vigia_plan_actividades')
    .select('*')
    .eq('plan_id', planId)
    .order('creado_en', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/vigia/plan-actividades  — agregar actividad
vigiaRouter.post('/plan-actividades', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const body = req.body as {
    plan_id: string; objetivo?: string; actividad: string; area_proceso?: string;
    responsable?: string; recursos?: string; presupuesto?: number; meses?: number[];
    indicador?: string; meta?: string;
  };
  if (!body.plan_id || !body.actividad)
    return res.status(400).json({ error: 'plan_id y actividad requeridos' });

  const { data: plan } = await db
    .from('vigia_plan_trabajo').select('empresa_id').eq('id', body.plan_id).single();
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
  if (!sess.es_admin && plan.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const { data, error } = await db
    .from('vigia_plan_actividades')
    .insert({
      plan_id:             body.plan_id,
      empresa_id:          plan.empresa_id,
      objetivo:            body.objetivo            || null,
      actividad:           body.actividad,
      area_proceso:        body.area_proceso        || null,
      responsable:         body.responsable         || null,
      recursos:            body.recursos            || null,
      presupuesto:         body.presupuesto         ?? null,
      meses:               body.meses               || [],
      indicador:           body.indicador           || null,
      meta:                body.meta                || null,
      estado_ejecucion:    'programado',
      porcentaje_ejecucion: 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/plan-actividades/:id  — actualizar actividad
vigiaRouter.put('/plan-actividades/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_plan_actividades').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Actividad no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const allowed = [
    'objetivo','actividad','area_proceso','responsable','recursos',
    'presupuesto','meses','indicador','meta',
    'estado_ejecucion','porcentaje_ejecucion','observaciones',
  ];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const { data, error } = await db
    .from('vigia_plan_actividades').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/plan-actividades/:id
vigiaRouter.delete('/plan-actividades/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_plan_actividades').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Actividad no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_plan_actividades').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// CAPACITACIONES SST (Decreto 1072 Art. 2.2.4.6.11 / Res. 0312 ítem 1.2)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/capacitaciones
vigiaRouter.get('/capacitaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined)
    : sess.empresa_id!;

  let query = db
    .from('vigia_capacitaciones')
    .select('*')
    .order('fecha', { ascending: false });

  if (empresaId) query = query.eq('empresa_id', empresaId);
  if (req.query.anio) {
    const anio = parseInt(req.query.anio as string);
    query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// GET /api/vigia/capacitaciones/:id  (incluye participantes)
vigiaRouter.get('/capacitaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const { data: cap, error: e1 } = await db
    .from('vigia_capacitaciones').select('*').eq('id', req.params.id).single();
  if (e1 || !cap) return res.status(404).json({ error: 'Capacitación no encontrada' });
  if (!sess.es_admin && cap.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const { data: participantes } = await db
    .from('vigia_capacitacion_participantes')
    .select('*')
    .eq('capacitacion_id', req.params.id)
    .order('nombre', { ascending: true });

  return res.json({ ...cap, participantes: participantes || [] });
});

// POST /api/vigia/capacitaciones
vigiaRouter.post('/capacitaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const b = req.body as {
    tema: string; tipo?: string; modalidad?: string; fecha?: string;
    duracion_horas?: number; instructor?: string; lugar?: string;
    objetivo?: string; contenido?: string; estado?: string;
    evaluacion_eficacia?: string; resultado_evaluacion?: string; observaciones?: string;
    empresa_id?: string;
  };
  if (!b.tema) return res.status(400).json({ error: 'tema requerido' });

  const empresa_id = sess.es_admin ? (b.empresa_id || sess.empresa_id) : sess.empresa_id!;

  const { data, error } = await db
    .from('vigia_capacitaciones')
    .insert({
      empresa_id,
      tema:                  b.tema,
      tipo:                  b.tipo                  || 'periódica',
      modalidad:             b.modalidad             || 'presencial',
      fecha:                 b.fecha                 || null,
      duracion_horas:        b.duracion_horas        ?? null,
      instructor:            b.instructor            || null,
      lugar:                 b.lugar                 || null,
      objetivo:              b.objetivo              || null,
      contenido:             b.contenido             || null,
      estado:                b.estado                || 'programada',
      evaluacion_eficacia:   b.evaluacion_eficacia   || 'pendiente',
      resultado_evaluacion:  b.resultado_evaluacion  || null,
      observaciones:         b.observaciones         || null,
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/capacitaciones/:id
vigiaRouter.put('/capacitaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_capacitaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Capacitación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const allowed = [
    'tema','tipo','modalidad','fecha','duracion_horas','instructor','lugar',
    'objetivo','contenido','estado','evaluacion_eficacia','resultado_evaluacion','observaciones',
  ];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await db
    .from('vigia_capacitaciones').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/capacitaciones/:id
vigiaRouter.delete('/capacitaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_capacitaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Capacitación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_capacitaciones').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// POST /api/vigia/capacitaciones/:id/participantes  — agregar participante
vigiaRouter.post('/capacitaciones/:id/participantes', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: cap } = await db
    .from('vigia_capacitaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!cap) return res.status(404).json({ error: 'Capacitación no encontrada' });
  if (!sess.es_admin && cap.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const b = req.body as { nombre: string; cedula?: string; cargo?: string; empleado_id?: string };
  if (!b.nombre) return res.status(400).json({ error: 'nombre requerido' });

  const { data, error } = await db
    .from('vigia_capacitacion_participantes')
    .insert({
      capacitacion_id: req.params.id,
      empresa_id:      cap.empresa_id,
      empleado_id:     b.empleado_id || null,
      nombre:          b.nombre,
      cedula:          b.cedula   || null,
      cargo:           b.cargo    || null,
      asistio:         true,
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/participantes/:id  — marcar asistencia / actualizar
vigiaRouter.put('/participantes/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_capacitacion_participantes').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Participante no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const allowed = ['nombre','cedula','cargo','asistio'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await db
    .from('vigia_capacitacion_participantes').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/participantes/:id
vigiaRouter.delete('/participantes/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_capacitacion_participantes').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Participante no encontrado' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_capacitacion_participantes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/participantes/:id/firma
vigiaRouter.put('/participantes/:id/firma', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { firma_b64 } = req.body as { firma_b64?: string };
  if (!firma_b64) return res.status(400).json({ error: 'firma_b64 requerida' });
  const { data: ex } = await db
    .from('vigia_capacitacion_participantes').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'Participante no encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_capacitacion_participantes')
    .update({ firma_b64, firmado_en: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/participantes/:id/firma
vigiaRouter.delete('/participantes/:id/firma', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db
    .from('vigia_capacitacion_participantes').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'Participante no encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_capacitacion_participantes')
    .update({ firma_b64: null, firmado_en: null })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// INVESTIGACIÓN DE AT/INCIDENTES (Resolución 1401 de 2007)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/investigaciones
vigiaRouter.get('/investigaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined)
    : sess.empresa_id!;

  let query = db
    .from('vigia_investigaciones')
    .select('*')
    .order('fecha_evento', { ascending: false });

  if (empresaId) query = query.eq('empresa_id', empresaId);
  if (req.query.anio) {
    const anio = parseInt(req.query.anio as string);
    query = query.gte('fecha_evento', `${anio}-01-01`).lte('fecha_evento', `${anio}-12-31`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// GET /api/vigia/investigaciones/:id  (incluye acciones correctivas)
vigiaRouter.get('/investigaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;

  const { data: inv, error: e1 } = await db
    .from('vigia_investigaciones').select('*').eq('id', req.params.id).single();
  if (e1 || !inv) return res.status(404).json({ error: 'Investigación no encontrada' });
  if (!sess.es_admin && inv.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const { data: acciones } = await db
    .from('vigia_acciones_inv')
    .select('*')
    .eq('investigacion_id', req.params.id)
    .order('creado_en', { ascending: true });

  return res.json({ ...inv, acciones: acciones || [] });
});

// POST /api/vigia/investigaciones
vigiaRouter.post('/investigaciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const b    = req.body as Record<string, unknown>;
  if (!b.tipo) return res.status(400).json({ error: 'tipo requerido' });

  const empresa_id = sess.es_admin ? (b.empresa_id || sess.empresa_id) : sess.empresa_id!;

  const campos = [
    'tipo','fecha_evento','hora_evento','fecha_reporte','empleado_id',
    'nombre_empleado','cargo','area','descripcion_evento',
    'parte_cuerpo','tipo_lesion','dias_incapacidad','fallecio',
    'reportado_arl','fecha_reporte_arl','reportado_mintrabajo','fecha_reporte_mintrabajo',
    'causas_inmediatas','causas_basicas','causa_raiz',
    'descripcion_causas','conclusiones','lecciones','estado',
  ];
  const insert: Record<string, unknown> = { empresa_id };
  for (const k of campos) if (b[k] !== undefined) insert[k] = b[k];

  const { data, error } = await db
    .from('vigia_investigaciones').insert(insert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/investigaciones/:id
vigiaRouter.put('/investigaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_investigaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Investigación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const campos = [
    'tipo','fecha_evento','hora_evento','fecha_reporte','empleado_id',
    'nombre_empleado','cargo','area','descripcion_evento',
    'parte_cuerpo','tipo_lesion','dias_incapacidad','fallecio',
    'reportado_arl','fecha_reporte_arl','reportado_mintrabajo','fecha_reporte_mintrabajo',
    'causas_inmediatas','causas_basicas','causa_raiz',
    'descripcion_causas','conclusiones','lecciones','estado',
  ];
  const updates: Record<string, unknown> = {};
  for (const k of campos) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await db
    .from('vigia_investigaciones').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/investigaciones/:id
vigiaRouter.delete('/investigaciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_investigaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Investigación no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_investigaciones').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// POST /api/vigia/investigaciones/:id/acciones
vigiaRouter.post('/investigaciones/:id/acciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: inv } = await db
    .from('vigia_investigaciones').select('empresa_id').eq('id', req.params.id).single();
  if (!inv) return res.status(404).json({ error: 'Investigación no encontrada' });
  if (!sess.es_admin && inv.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const b = req.body as { accion: string; responsable?: string; fecha_limite?: string };
  if (!b.accion) return res.status(400).json({ error: 'accion requerida' });

  const { data, error } = await db
    .from('vigia_acciones_inv')
    .insert({
      investigacion_id: req.params.id,
      empresa_id:       inv.empresa_id,
      accion:           b.accion,
      responsable:      b.responsable  || null,
      fecha_limite:     b.fecha_limite || null,
      estado:           'pendiente',
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/acciones-inv/:id
vigiaRouter.put('/acciones-inv/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_acciones_inv').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Acción no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });

  const allowed = ['accion','responsable','fecha_limite','estado','evidencia','fecha_cumplimiento'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const { data, error } = await db
    .from('vigia_acciones_inv').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/acciones-inv/:id
vigiaRouter.delete('/acciones-inv/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: existing } = await db
    .from('vigia_acciones_inv').select('empresa_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Acción no encontrada' });
  if (!sess.es_admin && existing.empresa_id !== sess.empresa_id)
    return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_acciones_inv').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ── Validación perfil Responsable SST ────────────────

const NIVELES_SST = ['TECNICO', 'TECNOLOGO', 'PROFESIONAL', 'ESPECIALISTA'];

function validarPerfilResponsable(emp: Record<string, any>): { estado: string; mensaje: string } {
  const nt  = emp.num_trabajadores || 0;
  const cr  = emp.clase_riesgo     || 'I';
  const niv = emp.resp_nivel_educativo;
  const exp = emp.resp_experiencia_anios || 0;

  if (!emp.resp_nombre || !emp.resp_licencia || !niv) {
    return { estado: 'PENDIENTE', mensaje: 'Perfil del Responsable SST sin completar' };
  }

  let minNivel: string, minExp: number;
  if (nt > 50 || ['IV','V'].includes(cr)) {
    minNivel = 'PROFESIONAL'; minExp = 0;
  } else if (nt >= 11) {
    minNivel = 'TECNOLOGO'; minExp = 2;
  } else {
    minNivel = 'TECNICO'; minExp = 1;
  }

  if (NIVELES_SST.indexOf(niv) < NIVELES_SST.indexOf(minNivel)) {
    return { estado: 'NO_HABILITADO', mensaje: `Se requiere mínimo nivel ${minNivel} para esta empresa (${nt} trabajadores, Clase ${cr})` };
  }
  if (exp < minExp) {
    return { estado: 'NO_HABILITADO', mensaje: `Se requieren mínimo ${minExp} año(s) de experiencia en SST` };
  }
  if (!emp.resp_cert50h_url && !emp.resp_cert50h_fecha) {
    return { estado: 'SIN_CERTIFICADO', mensaje: 'Faltan el certificado del curso virtual de 50 horas (o renovación de 20 horas)' };
  }
  return { estado: 'HABILITADO', mensaje: 'El Responsable SST cumple el perfil mínimo exigido por la Res. 0312/2019' };
}

const RESP_SELECT = 'id, nombre, nit, num_trabajadores, clase_riesgo, logo_url, resp_nombre, resp_licencia, resp_nivel_educativo, resp_experiencia_anios, resp_cert50h_fecha, resp_cert50h_url, resp_cert20h_fecha, resp_cert20h_url, resp_firma_b64, resp_fecha_designacion, rep_legal_nombre, rep_legal_firma_b64';

// GET /api/vigia/responsable
vigiaRouter.get('/responsable', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const id   = sess.es_admin ? (req.query.empresa_id as string) : sess.empresa_id!;
  if (!id) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data, error } = await db
    .from('vigia_empresas')
    .select(RESP_SELECT)
    .eq('id', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ...(data as Record<string, any>), validacion: validarPerfilResponsable(data as Record<string, any>) });
});

// PUT /api/vigia/responsable
vigiaRouter.put('/responsable', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const id   = sess.es_admin ? (req.body.empresa_id || sess.empresa_id) : sess.empresa_id!;

  const { resp_nombre, resp_licencia, resp_nivel_educativo, resp_experiencia_anios, resp_cert50h_fecha, resp_cert20h_fecha, rep_legal_nombre } = req.body;
  if (!resp_nombre || !resp_licencia || !resp_nivel_educativo) {
    return res.status(400).json({ error: 'nombre, licencia y nivel educativo son obligatorios' });
  }

  // Preserve existing designation date; set today only on first save
  const { data: curr } = await db.from('vigia_empresas').select('resp_fecha_designacion').eq('id', id).single();
  const fechaDesig = (curr as any)?.resp_fecha_designacion || new Date().toISOString().split('T')[0];

  const updates: Record<string, unknown> = {
    resp_nombre:             resp_nombre.trim(),
    resp_licencia:           resp_licencia.trim(),
    resp_nivel_educativo:    resp_nivel_educativo,
    resp_experiencia_anios:  resp_experiencia_anios ? parseInt(String(resp_experiencia_anios)) : null,
    resp_cert50h_fecha:      resp_cert50h_fecha     || null,
    resp_cert20h_fecha:      resp_cert20h_fecha     || null,
    resp_fecha_designacion:  fechaDesig,
    rep_legal_nombre:        rep_legal_nombre?.trim() || null,
  };

  const { data, error } = await db
    .from('vigia_empresas').update(updates).eq('id', id)
    .select(RESP_SELECT)
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ...(data as Record<string, any>), validacion: validarPerfilResponsable(data as Record<string, any>) });
});

async function ensureBucket(db: ReturnType<typeof getDB>, name: string, isPublic = true) {
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.find((b: { name: string }) => b.name === name)) {
    await db.storage.createBucket(name, { public: isPublic });
  }
}

// PUT /api/vigia/responsable/cert50h
vigiaRouter.put('/responsable/cert50h', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const id   = sess.es_admin ? (req.body.empresa_id || sess.empresa_id) : sess.empresa_id!;

  const { datos_base64, tipo_mime, nombre_archivo } = req.body;
  if (!datos_base64) return res.status(400).json({ error: 'datos_base64 requerido' });

  await ensureBucket(db, 'vigia-certs');

  const base64Data  = datos_base64.split(',').pop() || datos_base64;
  const ext         = (nombre_archivo?.split('.').pop() || tipo_mime?.split('/').pop() || 'pdf').toLowerCase();
  const contentType = tipo_mime || 'application/pdf';
  const buffer      = Buffer.from(base64Data, 'base64');
  const storagePath = `${id}/cert50h.${ext}`;

  const { error: upErr } = await db.storage.from('vigia-certs').upload(storagePath, buffer, { contentType, upsert: true });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const url = db.storage.from('vigia-certs').getPublicUrl(storagePath).data.publicUrl;
  await db.from('vigia_empresas').update({ resp_cert50h_url: url }).eq('id', id);
  return res.json({ ok: true, cert50h_url: url });
});

// PUT /api/vigia/responsable/cert20h
vigiaRouter.put('/responsable/cert20h', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const id   = sess.es_admin ? (req.body.empresa_id || sess.empresa_id) : sess.empresa_id!;

  const { datos_base64, tipo_mime, nombre_archivo } = req.body;
  if (!datos_base64) return res.status(400).json({ error: 'datos_base64 requerido' });

  await ensureBucket(db, 'vigia-certs');

  const base64Data  = datos_base64.split(',').pop() || datos_base64;
  const ext         = (nombre_archivo?.split('.').pop() || tipo_mime?.split('/').pop() || 'pdf').toLowerCase();
  const contentType = tipo_mime || 'application/pdf';
  const buffer      = Buffer.from(base64Data, 'base64');
  const storagePath = `${id}/cert20h.${ext}`;

  const { error: upErr } = await db.storage.from('vigia-certs').upload(storagePath, buffer, { contentType, upsert: true });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const url = db.storage.from('vigia-certs').getPublicUrl(storagePath).data.publicUrl;
  await db.from('vigia_empresas').update({ resp_cert20h_url: url }).eq('id', id);
  return res.json({ ok: true, cert20h_url: url });
});

// PUT /api/vigia/responsable/firma
vigiaRouter.put('/responsable/firma', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  if (sess.es_admin) return res.status(400).json({ error: 'Acción solo disponible para empresas' });
  const { firma_b64 } = req.body as { firma_b64?: string | null };
  const { error } = await db.from('vigia_empresas')
    .update({ resp_firma_b64: firma_b64 || null })
    .eq('id', sess.empresa_id!);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/responsable/firma-rl  — firma del Representante Legal
vigiaRouter.put('/responsable/firma-rl', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const id   = sess.es_admin ? (req.body.empresa_id || sess.empresa_id) : sess.empresa_id!;
  const { firma_b64 } = req.body as { firma_b64?: string | null };
  const { error } = await db.from('vigia_empresas')
    .update({ rep_legal_firma_b64: firma_b64 || null })
    .eq('id', id!);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ── EPP — Elementos de Protección Personal ────────────

// GET /api/vigia/epp/cargos
vigiaRouter.get('/epp/cargos', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined) || null
    : sess.empresa_id!;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  const { data, error } = await db
    .from('vigia_epp_cargo')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('area', { nullsFirst: true })
    .order('cargo');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/vigia/epp/cargos
vigiaRouter.post('/epp/cargos', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.body.empresa_id || sess.empresa_id)
    : sess.empresa_id!;
  const { area, cargo, peligros, epp_ids, observaciones } = req.body;
  if (!cargo) return res.status(400).json({ error: 'cargo requerido' });
  const { data, error } = await db
    .from('vigia_epp_cargo')
    .insert({ empresa_id: empresaId, area: area || null, cargo, peligros: peligros || null, epp_ids: epp_ids || [], observaciones: observaciones || null })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/epp/cargos/:id
vigiaRouter.put('/epp/cargos/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db.from('vigia_epp_cargo').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const { area, cargo, peligros, epp_ids, observaciones } = req.body;
  if (!cargo) return res.status(400).json({ error: 'cargo requerido' });
  const { data, error } = await db
    .from('vigia_epp_cargo')
    .update({ area: area || null, cargo, peligros: peligros || null, epp_ids: epp_ids || [], observaciones: observaciones || null })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/epp/cargos/:id
vigiaRouter.delete('/epp/cargos/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db.from('vigia_epp_cargo').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_epp_cargo').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// GET /api/vigia/epp/entregas
vigiaRouter.get('/epp/entregas', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined) || null
    : sess.empresa_id!;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
  let query = db.from('vigia_epp_entrega').select('*').eq('empresa_id', empresaId);
  if (req.query.empleado_id) query = query.eq('empleado_id', req.query.empleado_id as string);
  const { data, error } = await query.order('fecha_entrega', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/vigia/epp/entregas
vigiaRouter.post('/epp/entregas', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.body.empresa_id || sess.empresa_id)
    : sess.empresa_id!;
  const { empleado_id, nombre_empleado, cedula_empleado, cargo, area, jefe_directo,
          epp_id, epp_nombre, cantidad, talla, marca, condicion, motivo,
          fecha_entrega, fecha_vencimiento, observaciones } = req.body;
  if (!nombre_empleado || !epp_id || !epp_nombre || !fecha_entrega)
    return res.status(400).json({ error: 'nombre_empleado, epp_id, epp_nombre y fecha_entrega son requeridos' });
  const { data, error } = await db
    .from('vigia_epp_entrega')
    .insert({
      empresa_id: empresaId,
      empleado_id: empleado_id || null,
      nombre_empleado,
      cedula_empleado: cedula_empleado || null,
      cargo: cargo || null,
      area: area || null,
      jefe_directo: jefe_directo || null,
      epp_id,
      epp_nombre,
      cantidad: cantidad || 1,
      talla: talla || null,
      marca: marca || null,
      condicion: condicion || 'NUEVO',
      motivo: motivo || 'PRIMERA_ENTREGA',
      fecha_entrega,
      fecha_vencimiento: fecha_vencimiento || null,
      observaciones: observaciones || null,
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/vigia/epp/entregas/:id
vigiaRouter.put('/epp/entregas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db.from('vigia_epp_entrega').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const allowed = ['empleado_id','nombre_empleado','cedula_empleado','cargo','area','jefe_directo','epp_id','epp_nombre','cantidad','talla','marca','condicion','motivo','fecha_entrega','fecha_vencimiento','observaciones'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
  const { data, error } = await db.from('vigia_epp_entrega').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/epp/entregas/:id
vigiaRouter.delete('/epp/entregas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db.from('vigia_epp_entrega').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_epp_entrega').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/epp/entregas/:id/firma
vigiaRouter.put('/epp/entregas/:id/firma', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { firma_b64 } = req.body as { firma_b64?: string };
  if (!firma_b64) return res.status(400).json({ error: 'firma_b64 requerida' });
  const { data: ex } = await db.from('vigia_epp_entrega').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_epp_entrega')
    .update({ firma_b64, firmado_en: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/epp/entregas/:id/firma
vigiaRouter.delete('/epp/entregas/:id/firma', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { data: ex } = await db.from('vigia_epp_entrega').select('empresa_id').eq('id', req.params.id).single();
  if (!ex) return res.status(404).json({ error: 'No encontrado' });
  if (!sess.es_admin && (ex as any).empresa_id !== sess.empresa_id) return res.status(403).json({ error: 'Sin acceso' });
  const { error } = await db.from('vigia_epp_entrega')
    .update({ firma_b64: null, firmado_en: null })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// GET /api/vigia/stats
vigiaRouter.get('/stats', vigiaAuth, async (req: Request, res: Response) => {
  const db = getDB();
  const sess = req.vigiaSession!;

  let query = db.from('vigia_empleados').select('alerta_nivel');
  if (!sess.es_admin) query = query.eq('empresa_id', sess.empresa_id!);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const lista = data || [];
  return res.json({
    total:        lista.length,
    criticos:     lista.filter((e: any) => e.alerta_nivel === 'CRITICO').length,
    advertencias: lista.filter((e: any) => e.alerta_nivel === 'ADVERTENCIA').length,
    seguimiento:  lista.filter((e: any) => e.alerta_nivel === 'SEGUIMIENTO').length,
    ok:           lista.filter((e: any) => e.alerta_nivel === 'OK').length,
  });
});

// ── Enlaces a documentos externos (Drive / SharePoint) ─────────────────────

// GET /api/vigia/doc-links
vigiaRouter.get('/doc-links', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.query.empresa_id as string | undefined) || sess.empresa_id
    : sess.empresa_id!;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });

  const { data, error } = await db
    .from('vigia_doc_links')
    .select('codigo, url')
    .eq('empresa_id', empresaId);
  if (error) return res.status(500).json({ error: error.message });

  const map: Record<string, string> = {};
  for (const row of (data || [])) map[(row as any).codigo] = (row as any).url;
  return res.json(map);
});

// PUT /api/vigia/doc-links/:codigo
vigiaRouter.put('/doc-links/:codigo', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const empresaId = sess.es_admin
    ? (req.body.empresa_id || sess.empresa_id)
    : sess.empresa_id!;
  if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });

  const codigo = decodeURIComponent(req.params.codigo as string);
  const { url } = req.body as { url?: string };

  if (!url || !url.trim()) {
    // Borrar el enlace
    await db.from('vigia_doc_links').delete().eq('empresa_id', empresaId).eq('codigo', codigo);
    return res.json({ ok: true, deleted: true });
  }

  const { error } = await db.from('vigia_doc_links').upsert(
    { empresa_id: empresaId, codigo, url: url.trim(), updated_at: new Date().toISOString() },
    { onConflict: 'empresa_id,codigo' }
  );
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, codigo, url: url.trim() });
});

// ══════════════════════════════════════════════════════════════════════
// PLAN DE EMERGENCIAS + BRIGADA (Res. 0312 · 5.1.1 + 5.1.2)
// ══════════════════════════════════════════════════════════════════════

function empresaIdFrom(sess: any, body: any): string | null {
  return sess.es_admin ? (body?.empresa_id || null) : sess.empresa_id || null;
}

// GET /api/vigia/emergencias
vigiaRouter.get('/emergencias', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json({ amenazas: [], simulacros: [], brigada: [] });
  const [a, s, b] = await Promise.all([
    db.from('vigia_emergencias_plan').select('*').eq('empresa_id', eid).order('nivel_riesgo'),
    db.from('vigia_emergencias_simulacro').select('*').eq('empresa_id', eid).order('fecha', { ascending: false }),
    db.from('vigia_brigada_miembro').select('*').eq('empresa_id', eid).eq('activo', true).order('tipo_brigada'),
  ]);
  return res.json({ amenazas: a.data || [], simulacros: s.data || [], brigada: b.data || [] });
});

// POST /api/vigia/emergencias/amenazas
vigiaRouter.post('/emergencias/amenazas', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_emergencias_plan')
    .insert({ empresa_id: eid, ...req.body, updated_at: new Date().toISOString() })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/emergencias/amenazas/:id
vigiaRouter.put('/emergencias/amenazas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_emergencias_plan')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/emergencias/amenazas/:id
vigiaRouter.delete('/emergencias/amenazas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_emergencias_plan').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// POST /api/vigia/emergencias/simulacros
vigiaRouter.post('/emergencias/simulacros', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_emergencias_simulacro')
    .insert({ empresa_id: eid, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/emergencias/simulacros/:id
vigiaRouter.delete('/emergencias/simulacros/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_emergencias_simulacro').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// POST /api/vigia/emergencias/brigada
vigiaRouter.post('/emergencias/brigada', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_brigada_miembro')
    .insert({ empresa_id: eid, activo: true, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/emergencias/brigada/:id
vigiaRouter.put('/emergencias/brigada/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_brigada_miembro')
    .update(rest)
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/emergencias/brigada/:id
vigiaRouter.delete('/emergencias/brigada/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_brigada_miembro').update({ activo: false }).eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// COPASST + COMITÉ DE CONVIVENCIA LABORAL (1.1.6 / 1.1.7 / 1.1.8)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/copasst
vigiaRouter.get('/copasst', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json({ miembros: [], actas: [] });
  const [m, a] = await Promise.all([
    db.from('vigia_copasst_miembro').select('*').eq('empresa_id', eid).eq('activo', true).order('tipo').order('rol'),
    db.from('vigia_copasst_acta').select('*').eq('empresa_id', eid).order('fecha', { ascending: false }),
  ]);
  return res.json({ miembros: m.data || [], actas: a.data || [] });
});

// POST /api/vigia/copasst/miembros
vigiaRouter.post('/copasst/miembros', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_copasst_miembro')
    .insert({ empresa_id: eid, activo: true, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/copasst/miembros/:id
vigiaRouter.put('/copasst/miembros/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_copasst_miembro')
    .update(rest)
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/copasst/miembros/:id
vigiaRouter.delete('/copasst/miembros/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_copasst_miembro').update({ activo: false }).eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// POST /api/vigia/copasst/actas
vigiaRouter.post('/copasst/actas', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_copasst_acta')
    .insert({ empresa_id: eid, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/copasst/actas/:id
vigiaRouter.put('/copasst/actas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_copasst_acta')
    .update(rest)
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/copasst/actas/:id
vigiaRouter.delete('/copasst/actas/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_copasst_acta').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// MEJORAMIENTO — ACCIONES CORRECTIVAS / PREVENTIVAS (7.1.1–7.1.4)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/mejoramiento
vigiaRouter.get('/mejoramiento', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json([]);
  const { data } = await db.from('vigia_mejoramiento').select('*').eq('empresa_id', eid)
    .order('fecha_limite', { ascending: true });
  return res.json(data || []);
});

// POST /api/vigia/mejoramiento
vigiaRouter.post('/mejoramiento', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_mejoramiento')
    .insert({ empresa_id: eid, estado: 'ABIERTA', ...req.body, updated_at: new Date().toISOString() })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/mejoramiento/:id
vigiaRouter.put('/mejoramiento/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_mejoramiento')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/mejoramiento/:id
vigiaRouter.delete('/mejoramiento/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_mejoramiento').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// AUDITORÍA INTERNA (6.1.2 / 6.1.3 / 6.1.4)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/auditorias
vigiaRouter.get('/auditorias', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json([]);
  const { data } = await db.from('vigia_auditoria').select('*').eq('empresa_id', eid)
    .order('anio', { ascending: false });
  return res.json(data || []);
});

// POST /api/vigia/auditorias
vigiaRouter.post('/auditorias', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_auditoria')
    .insert({ empresa_id: eid, ...req.body, updated_at: new Date().toISOString() })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/auditorias/:id
vigiaRouter.put('/auditorias/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_auditoria')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/auditorias/:id
vigiaRouter.delete('/auditorias/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_auditoria').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// INSPECCIONES (4.2.4) + MANTENIMIENTO (4.2.5)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/inspecciones
vigiaRouter.get('/inspecciones', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json([]);
  const { data } = await db.from('vigia_inspeccion').select('*').eq('empresa_id', eid)
    .order('fecha', { ascending: false });
  return res.json(data || []);
});

// POST /api/vigia/inspecciones
vigiaRouter.post('/inspecciones', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_inspeccion')
    .insert({ empresa_id: eid, estado: 'ABIERTA', ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/inspecciones/:id
vigiaRouter.put('/inspecciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_inspeccion')
    .update(rest)
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/inspecciones/:id
vigiaRouter.delete('/inspecciones/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_inspeccion').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// GET /api/vigia/mantenimiento
vigiaRouter.get('/mantenimiento', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json([]);
  const { data } = await db.from('vigia_mantenimiento').select('*').eq('empresa_id', eid)
    .order('proxima_fecha', { ascending: true });
  return res.json(data || []);
});

// POST /api/vigia/mantenimiento
vigiaRouter.post('/mantenimiento', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const eid = empresaIdFrom(req.vigiaSession!, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { error, data } = await db.from('vigia_mantenimiento')
    .insert({ empresa_id: eid, estado: 'PENDIENTE', ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/mantenimiento/:id
vigiaRouter.put('/mantenimiento/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_mantenimiento')
    .update(rest)
    .eq('id', req.params.id)
    .eq('empresa_id', sess.empresa_id ?? req.body.empresa_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// DELETE /api/vigia/mantenimiento/:id
vigiaRouter.delete('/mantenimiento/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || sess.empresa_id) : sess.empresa_id!;
  await db.from('vigia_mantenimiento').delete().eq('id', req.params.id).eq('empresa_id', eid);
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// PERFIL SALUD (3.1.1 / 3.1.2 / 3.1.7 / 4.1.4)
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/perfil-salud
vigiaRouter.get('/perfil-salud', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin ? (req.query.empresa_id as string || null) : sess.empresa_id!;
  if (!eid) return res.json([]);
  const anio = req.query.anio ? parseInt(req.query.anio as string) : null;
  let q = db.from('vigia_perfil_salud').select('*').eq('empresa_id', eid);
  if (anio) q = q.eq('anio', anio);
  const { data } = await q.order('anio', { ascending: false });
  return res.json(data || []);
});

// PUT /api/vigia/perfil-salud/:anio
vigiaRouter.put('/perfil-salud/:anio', vigiaAuth, async (req: Request, res: Response) => {
  const db  = getDB();
  const sess = req.vigiaSession!;
  if (sess.es_admin) return res.status(400).json({ error: 'Solo empresas' });
  const eid  = sess.empresa_id!;
  const anio = parseInt(req.params.anio as string);
  if (!anio) return res.status(400).json({ error: 'Año inválido' });
  const { empresa_id: _, ...rest } = req.body;
  const { error } = await db.from('vigia_perfil_salud').upsert(
    { empresa_id: eid, anio, ...rest, updated_at: new Date().toISOString() },
    { onConflict: 'empresa_id,anio' }
  );
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// ALERTAS CENTRALIZADAS — vencimientos de todos los módulos
// ══════════════════════════════════════════════════════════════════════

// GET /api/vigia/alertas
vigiaRouter.get('/alertas', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.es_admin
    ? (req.query.empresa_id as string | undefined) || null
    : sess.empresa_id!;

  const hoy      = new Date(); hoy.setHours(0,0,0,0);
  const hoyStr   = hoy.toISOString().split('T')[0];
  const d30      = new Date(hoy); d30.setDate(d30.getDate() + 30);
  const d60      = new Date(hoy); d60.setDate(d60.getDate() + 60);
  const d365ago  = new Date(hoy); d365ago.setFullYear(d365ago.getFullYear() - 1);
  const alertas: any[] = [];

  const diasHasta = (fecha: string) =>
    Math.round((new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000);
  const nivelDias = (d: number) => d < 0 ? 'VENCIDO' : d <= 7 ? 'CRITICO' : 'PROXIMO';

  // ── 1. Exámenes médicos ───────────────────────────────────────────
  // Trae empresa con vigencia_meses, luego examenes del último por empleado
  const empresasQ = sess.es_admin
    ? await db.from('vigia_empresas').select('id, nombre, vigencia_meses').eq('activa', true)
    : await db.from('vigia_empresas').select('id, nombre, vigencia_meses').eq('id', eid!).single().then(r => ({ data: r.data ? [r.data] : [], error: r.error }));

  for (const emp of ((empresasQ as any).data || [])) {
    const vm: number = (emp as any).vigencia_meses || 12;
    // Último examen por empleado (no retiro/egreso)
    const { data: examenes } = await db
      .from('vigia_examenes')
      .select('fecha, tipo, vigia_empleados!inner(id, nombre, cargo, empresa_id)')
      .eq('vigia_empleados.empresa_id', (emp as any).id)
      .not('tipo', 'in', '("RETIRO","EGRESO","SEGUIMIENTO")')
      .order('fecha', { ascending: false });

    // Agrupar por empleado: solo el examen más reciente
    const porEmpleado: Record<string, any> = {};
    for (const ex of (examenes || [])) {
      const empId = (ex as any).vigia_empleados?.id;
      if (empId && !porEmpleado[empId]) porEmpleado[empId] = ex;
    }

    for (const ex of Object.values(porEmpleado)) {
      const vence = new Date(ex.fecha + 'T00:00:00');
      vence.setMonth(vence.getMonth() + vm);
      const venceStr = vence.toISOString().split('T')[0];
      const dias = diasHasta(venceStr);
      if (dias > 60) continue;
      alertas.push({
        tipo: 'EXAMEN', nivel: nivelDias(dias), dias,
        descripcion: `Examen médico de ${ex.vigia_empleados?.nombre} (${ex.vigia_empleados?.cargo || 'sin cargo'})`,
        detalle: dias < 0 ? `Vencido hace ${-dias} días` : `Vence en ${dias} días`,
        url: 'lista-personal.html',
        empresa_id: (emp as any).id,
        empresa_nombre: (emp as any).nombre,
      });
    }
  }

  // ── 2. EPP con fecha de vencimiento ──────────────────────────────
  {
    let q = db.from('vigia_epp_entrega')
      .select('id, nombre_empleado, cargo, epp_nombre, fecha_vencimiento, empresa_id')
      .not('fecha_vencimiento', 'is', null)
      .lte('fecha_vencimiento', d30.toISOString().split('T')[0]);
    if (eid) q = q.eq('empresa_id', eid);
    const { data } = await q;
    for (const e of (data || [])) {
      const dias = diasHasta((e as any).fecha_vencimiento);
      alertas.push({
        tipo: 'EPP', nivel: nivelDias(dias), dias,
        descripcion: `EPP "${(e as any).epp_nombre}" · ${(e as any).nombre_empleado}`,
        detalle: dias < 0 ? `Vencido hace ${-dias} días` : `Vence en ${dias} días`,
        url: 'epp.html',
        empresa_id: (e as any).empresa_id,
      });
    }
  }

  // ── 3. Mantenimiento próximo (proxima_fecha ≤ 30 días, PENDIENTE) ─
  {
    let q = db.from('vigia_mantenimiento')
      .select('id, equipo, tipo, proxima_fecha, estado, empresa_id')
      .eq('estado', 'PENDIENTE')
      .not('proxima_fecha', 'is', null)
      .lte('proxima_fecha', d30.toISOString().split('T')[0]);
    if (eid) q = q.eq('empresa_id', eid);
    const { data } = await q;
    for (const m of (data || [])) {
      const dias = diasHasta((m as any).proxima_fecha);
      alertas.push({
        tipo: 'MANTENIMIENTO', nivel: nivelDias(dias), dias,
        descripcion: `Mantenimiento ${(m as any).tipo?.toLowerCase()} · ${(m as any).equipo}`,
        detalle: dias < 0 ? `Vencido hace ${-dias} días` : `Programado en ${dias} días`,
        url: 'inspecciones.html',
        empresa_id: (m as any).empresa_id,
      });
    }
  }

  // ── 4. Acciones de mejoramiento vencidas ─────────────────────────
  {
    let q = db.from('vigia_mejoramiento')
      .select('id, descripcion, tipo, fecha_limite, estado, empresa_id')
      .not('estado', 'eq', 'CERRADA')
      .not('fecha_limite', 'is', null)
      .lt('fecha_limite', hoyStr);
    if (eid) q = q.eq('empresa_id', eid);
    const { data } = await q;
    for (const m of (data || [])) {
      const dias = diasHasta((m as any).fecha_limite);
      alertas.push({
        tipo: 'MEJORAMIENTO', nivel: 'VENCIDO', dias,
        descripcion: `Acción ${(m as any).tipo?.toLowerCase()} vencida`,
        detalle: (m as any).descripcion?.substring(0, 80),
        url: 'mejoramiento.html',
        empresa_id: (m as any).empresa_id,
      });
    }
  }

  // ── 5. Periodos COPASST / CCL próximos a vencer (≤ 60 días) ──────
  {
    let q = db.from('vigia_copasst_miembro')
      .select('id, nombre, tipo, cargo_copasst, fecha_fin, empresa_id')
      .eq('activo', true)
      .not('fecha_fin', 'is', null)
      .lte('fecha_fin', d60.toISOString().split('T')[0]);
    if (eid) q = q.eq('empresa_id', eid);
    const { data } = await q;
    for (const c of (data || [])) {
      const dias = diasHasta((c as any).fecha_fin);
      alertas.push({
        tipo: 'COPASST', nivel: nivelDias(dias), dias,
        descripcion: `Período ${(c as any).tipo} · ${(c as any).nombre} (${(c as any).cargo_copasst})`,
        detalle: dias < 0 ? `Período vencido hace ${-dias} días` : `Período vence en ${dias} días`,
        url: 'copasst.html',
        empresa_id: (c as any).empresa_id,
      });
    }
  }

  // ── 6. Simulacro anual ────────────────────────────────────────────
  // Alerta si no hay simulacro en los últimos 365 días
  {
    const empresasCheck = sess.es_admin
      ? ((empresasQ as any).data || [])
      : [{ id: eid, nombre: '' }];

    for (const emp of empresasCheck) {
      const { data: sims } = await db
        .from('vigia_emergencias_simulacro')
        .select('id, fecha')
        .eq('empresa_id', (emp as any).id)
        .gte('fecha', d365ago.toISOString().split('T')[0])
        .order('fecha', { ascending: false })
        .limit(1);

      if (!sims || sims.length === 0) {
        alertas.push({
          tipo: 'SIMULACRO', nivel: 'VENCIDO', dias: -365,
          descripcion: 'Sin simulacro de emergencia en el último año',
          detalle: 'La Res. 0312 exige al menos un simulacro anual (Est. 5.1.1)',
          url: 'emergencias.html',
          empresa_id: (emp as any).id,
          empresa_nombre: (emp as any).nombre,
        });
      }
    }
  }

  // Ordenar: VENCIDO primero, luego CRITICO, luego PROXIMO; dentro de cada nivel por días
  const orden = { VENCIDO: 0, CRITICO: 1, PROXIMO: 2 };
  alertas.sort((a, b) => {
    const on = (orden[a.nivel as keyof typeof orden] ?? 3) - (orden[b.nivel as keyof typeof orden] ?? 3);
    if (on !== 0) return on;
    return a.dias - b.dias;
  });

  return res.json(alertas);
});

// ── Ausentismo laboral (Res. 0312 Est. 6.1.1) ────────────────────────────────

vigiaRouter.get('/ausentismo', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.query);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });

  const anio = req.query.anio ? parseInt(req.query.anio as string) : null;
  let q = db.from('vigia_ausentismo').select('*').eq('empresa_id', eid).order('fecha_inicio', { ascending: false });
  if (anio) q = (q as any).gte('fecha_inicio', `${anio}-01-01`).lte('fecha_inicio', `${anio}-12-31`);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// IMPORTANTE: /indicadores debe ir ANTES de /:id para que Express no lo trate como param
vigiaRouter.get('/ausentismo/indicadores', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.query);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });

  const anio = req.query.anio ? parseInt(req.query.anio as string) : new Date().getFullYear();

  const [{ data: rows }, { data: empData }] = await Promise.all([
    db.from('vigia_ausentismo').select('*')
      .eq('empresa_id', eid)
      .gte('fecha_inicio', `${anio}-01-01`)
      .lte('fecha_inicio', `${anio}-12-31`)
      .order('fecha_inicio'),
    db.from('vigia_empresas').select('num_trabajadores, nombre').eq('id', eid).single(),
  ]);

  const numTrab  = (empData as any)?.num_trabajadores || 1;
  const empresa  = (empData as any)?.nombre || '';
  const records  = (rows || []) as any[];
  const K        = 200000; // factor estándar Colombia
  const diasHab  = 248;   // días hábiles aprox. anuales en Colombia
  const diasLab  = numTrab * diasHab;
  const hhTrab   = diasLab * 8;
  const totDias  = records.reduce((s, r) => s + (r.dias_perdidos || 0), 0);
  const totEv    = records.length;
  const afectSet = new Set(records.map(r => r.empleado_id || r.nombre_empleado).filter(Boolean));
  const tasa     = diasLab > 0 ? +((totDias / diasLab) * 100).toFixed(2) : 0;
  const iFrec    = hhTrab  > 0 ? +(totEv  * K / hhTrab).toFixed(2) : 0;
  const iSev     = hhTrab  > 0 ? +(totDias * K / hhTrab).toFixed(2) : 0;
  const iLesion  = +(iFrec * iSev / 1000).toFixed(4);

  const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const porMes: Record<string, any> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${anio}-${String(m).padStart(2, '0')}`;
    porMes[key] = { mes: key, mes_label: MESES[m], dias_perdidos: 0, eventos: 0 };
  }
  const porTipo: Record<string, any> = {};
  const porArea: Record<string, any> = {};
  for (const r of records) {
    const mk = (r.fecha_inicio as string).slice(0, 7);
    if (porMes[mk]) { porMes[mk].dias_perdidos += r.dias_perdidos || 0; porMes[mk].eventos++; }
    const t = r.tipo || 'OTRO';
    if (!porTipo[t]) porTipo[t] = { tipo: t, dias_perdidos: 0, eventos: 0, pct_dias: 0 };
    porTipo[t].dias_perdidos += r.dias_perdidos || 0; porTipo[t].eventos++;
    const a = r.area || 'Sin área';
    if (!porArea[a]) porArea[a] = { area: a, dias_perdidos: 0, eventos: 0 };
    porArea[a].dias_perdidos += r.dias_perdidos || 0; porArea[a].eventos++;
  }
  for (const v of Object.values(porTipo)) v.pct_dias = totDias > 0 ? +((v.dias_perdidos / totDias) * 100).toFixed(1) : 0;

  return res.json({
    empresa, anio, generado_en: new Date().toISOString(), num_trabajadores: numTrab,
    indicadores: { tasa_ausentismo_pct: tasa, dias_perdidos_total: totDias, eventos_total: totEv,
      trabajadores_afectados: afectSet.size, indice_frecuencia: iFrec, indice_severidad: iSev,
      indice_lesion_incapacitante: iLesion },
    por_mes:  Object.values(porMes),
    por_tipo: Object.values(porTipo).sort((a, b) => b.dias_perdidos - a.dias_perdidos),
    por_area: Object.values(porArea).sort((a, b) => b.dias_perdidos - a.dias_perdidos),
    detalle: records.map(r => ({
      fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin, dias_perdidos: r.dias_perdidos,
      nombre: r.nombre_empleado || '', cargo: r.cargo || '', area: r.area || '',
      tipo: r.tipo, con_incapacidad: r.con_incapacidad, diagnostico: r.diagnostico || '',
    })),
  });
});

vigiaRouter.post('/ausentismo', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });

  const { empleado_id, nombre_empleado, cargo, area, tipo, fecha_inicio, fecha_fin, dias_perdidos, con_incapacidad, diagnostico, observaciones } = req.body;
  if (!tipo || !fecha_inicio || !fecha_fin || dias_perdidos == null)
    return res.status(400).json({ error: 'tipo, fecha_inicio, fecha_fin y dias_perdidos son requeridos' });

  const { data, error } = await db.from('vigia_ausentismo').insert({
    empresa_id: eid, empleado_id: empleado_id || null,
    nombre_empleado: nombre_empleado || null, cargo: cargo || null, area: area || null,
    tipo, fecha_inicio, fecha_fin, dias_perdidos: parseInt(String(dias_perdidos)),
    con_incapacidad: !!con_incapacidad, diagnostico: diagnostico || null, observaciones: observaciones || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

vigiaRouter.put('/ausentismo/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  const { id } = req.params;
  const { empleado_id, nombre_empleado, cargo, area, tipo, fecha_inicio, fecha_fin, dias_perdidos, con_incapacidad, diagnostico, observaciones } = req.body;

  const { data, error } = await db.from('vigia_ausentismo').update({
    empleado_id: empleado_id || null, nombre_empleado: nombre_empleado || null,
    cargo: cargo || null, area: area || null, tipo, fecha_inicio, fecha_fin,
    dias_perdidos: parseInt(String(dias_perdidos)), con_incapacidad: !!con_incapacidad,
    diagnostico: diagnostico || null, observaciones: observaciones || null,
  }).eq('id', id).eq('empresa_id', eid!).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No encontrado' });
  return res.json(data);
});

vigiaRouter.delete('/ausentismo/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.empresa_id || null;
  const { id } = req.params;
  const filter = sess.es_admin
    ? db.from('vigia_ausentismo').delete().eq('id', id)
    : db.from('vigia_ausentismo').delete().eq('id', id).eq('empresa_id', eid!);
  const { error } = await filter;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// ── Indicadores SG-SST (SURA / Ministerio estándar) ──────────────────────────────────

// GET /api/vigia/indicadores-sgsst  — dashboard consolidado anual con CUMPLE/NO CUMPLE
vigiaRouter.get('/indicadores-sgsst', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.query as any);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });

  const anio = parseInt(String(req.query.anio || new Date().getFullYear()));

  // Datos mensuales SG-SST
  const { data: meses, error: errM } = await db
    .from('vigia_sgsst_mensual')
    .select('*')
    .eq('empresa_id', eid)
    .eq('anio', anio)
    .order('mes');
  if (errM) return res.status(500).json({ error: errM.message });

  // Ausentismo real de vigia_ausentismo (complementa entrada directa)
  const { data: ausRecs } = await db
    .from('vigia_ausentismo')
    .select('fecha_inicio, dias_perdidos, tipo')
    .eq('empresa_id', eid)
    .gte('fecha_inicio', `${anio}-01-01`)
    .lte('fecha_inicio', `${anio}-12-31`);

  // Empresa
  const { data: emp } = await db.from('vigia_empresas').select('nombre, num_trabajadores').eq('id', eid).single();

  const rows = (meses || []) as any[];

  // Totales anuales
  const totAt           = rows.reduce((s, r) => s + (r.num_at || 0), 0);
  const totDiasAt       = rows.reduce((s, r) => s + (r.dias_perdidos_at || 0) + (r.dias_cargados_at || 0), 0);
  const totMortales     = rows.reduce((s, r) => s + (r.num_at_mortales || 0), 0);
  const totNuevosEL     = rows.reduce((s, r) => s + (r.casos_nuevos_el || 0), 0);
  const totAntiguosEL   = rows.reduce((s, r) => s + (r.casos_antiguos_el || 0), 0);
  const totTrab         = rows.reduce((s, r) => s + (r.num_trabajadores || 0), 0);
  const promTrab        = rows.length > 0 ? totTrab / rows.length : (emp?.num_trabajadores || 0);
  const totDiasAus      = rows.reduce((s, r) => s + (r.dias_ausencia_laboral || 0) + (r.dias_ausencia_comun || 0), 0);
  const totDiasProg     = rows.reduce((s, r) => s + ((r.num_trabajadores || 0) * (r.dias_laborales || 30)), 0);

  // E-P-R (últimas cifras del año o suma)
  const eprE_c = rows.reduce((s, r) => s + (r.epr_estructura_cumplidos || 0), 0);
  const eprE_t = rows.reduce((s, r) => s + (r.epr_estructura_total || 0), 0);
  const eprP_c = rows.reduce((s, r) => s + (r.epr_proceso_cumplidos || 0), 0);
  const eprP_t = rows.reduce((s, r) => s + (r.epr_proceso_total || 0), 0);
  const eprR_c = rows.reduce((s, r) => s + (r.epr_resultado_cumplidos || 0), 0);
  const eprR_t = rows.reduce((s, r) => s + (r.epr_resultado_total || 0), 0);

  // Fórmulas SURA
  const ifAt        = totTrab > 0 ? +((totAt       / totTrab) * 100).toFixed(2) : 0;
  const isAt        = totTrab > 0 ? +((totDiasAt   / totTrab) * 100).toFixed(2) : 0;
  const ipMort      = totAt   > 0 ? +((totMortales / totAt)   * 100).toFixed(2) : 0;
  const prevEL      = promTrab > 0 ? +((( totNuevosEL + totAntiguosEL) / promTrab) * 100000).toFixed(2) : 0;
  const incEL       = promTrab > 0 ? +((totNuevosEL / promTrab) * 100000).toFixed(2) : 0;
  const pctAus      = totDiasProg > 0 ? +((totDiasAus / totDiasProg) * 100).toFixed(2) : 0;
  const estrPct     = eprE_t > 0 ? +((eprE_c / eprE_t) * 100).toFixed(1) : null;
  const procPct     = eprP_t > 0 ? +((eprP_c / eprP_t) * 100).toFixed(1) : null;
  const resPct      = eprR_t > 0 ? +((eprR_c / eprR_t) * 100).toFixed(1) : null;

  // Por mes
  const mesesOut = rows.map(r => {
    const n = r.num_trabajadores || 0;
    const dp = r.dias_laborales || 30;
    const diasProg = n * dp;
    const diasAus = (r.dias_ausencia_laboral || 0) + (r.dias_ausencia_comun || 0);
    const dirsAt = (r.dias_perdidos_at || 0) + (r.dias_cargados_at || 0);
    return {
      mes: r.mes,
      num_trabajadores: n,
      dias_laborales: dp,
      num_at: r.num_at || 0,
      dias_perdidos_at: r.dias_perdidos_at || 0,
      dias_cargados_at: r.dias_cargados_at || 0,
      num_at_mortales: r.num_at_mortales || 0,
      casos_nuevos_el: r.casos_nuevos_el || 0,
      casos_antiguos_el: r.casos_antiguos_el || 0,
      dias_ausencia_laboral: r.dias_ausencia_laboral || 0,
      dias_ausencia_comun: r.dias_ausencia_comun || 0,
      // indicadores mensuales
      if_at:    n > 0 ? +((r.num_at / n) * 100).toFixed(2) : 0,
      is_at:    n > 0 ? +((dirsAt / n) * 100).toFixed(2) : 0,
      pct_aus:  diasProg > 0 ? +((diasAus / diasProg) * 100).toFixed(2) : 0,
      cumple_if_at:  n > 0 ? ((r.num_at / n) * 100) <= 8  : true,
      cumple_is_at:  n > 0 ? ((dirsAt / n)   * 100) <= 50 : true,
      cumple_aus:    diasProg > 0 ? ((diasAus / diasProg) * 100) <= 2 : true,
    };
  });

  return res.json({
    empresa: emp?.nombre || '', anio,
    generado_en: new Date().toISOString(),
    promedio_trabajadores: +promTrab.toFixed(0),
    indicadores: {
      at_frecuencia:    { valor: ifAt,    meta_mensual: 8,    meta_anual: 30,  cumple: ifAt   <= 30  },
      at_severidad:     { valor: isAt,    meta_mensual: 50,   meta_anual: 30,  cumple: isAt   <= 30  },
      at_prop_mortales: { valor: ipMort,  meta: 0,           cumple: ipMort === 0 },
      el_prevalencia:   { valor: prevEL,  meta: 0,           cumple: prevEL === 0 },
      el_incidencia:    { valor: incEL,   meta: 0,           cumple: incEL  === 0 },
      ausentismo:       { valor: pctAus,  meta_mensual: 2,   meta_anual: 2,  cumple: pctAus <= 2   },
      epr_estructura:   { valor: estrPct, meta: 95,          cumple: estrPct !== null ? estrPct >= 95 : null },
      epr_proceso:      { valor: procPct, meta: null,        cumple: null },
      epr_resultado:    { valor: resPct,  meta: null,        cumple: null },
    },
    totales: {
      num_at: totAt, dias_at: totDiasAt, mortales: totMortales,
      nuevos_el: totNuevosEL, antiguos_el: totAntiguosEL,
      dias_ausencia: totDiasAus, dias_programados: totDiasProg,
    },
    por_mes: mesesOut,
    detalle_mensual: rows,
  });
});

// GET /api/vigia/sgsst-mensual  — listado mensual editable
vigiaRouter.get('/sgsst-mensual', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.query as any);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const anio = req.query.anio ? parseInt(String(req.query.anio)) : new Date().getFullYear();
  const { data, error } = await db.from('vigia_sgsst_mensual').select('*').eq('empresa_id', eid).eq('anio', anio).order('mes');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

// POST /api/vigia/sgsst-mensual  — crear o reemplazar mes (upsert)
vigiaRouter.post('/sgsst-mensual', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });

  const { anio, mes, num_trabajadores, dias_laborales,
          num_at, dias_perdidos_at, dias_cargados_at, num_at_mortales,
          casos_nuevos_el, casos_antiguos_el,
          dias_ausencia_laboral, dias_ausencia_comun,
          epr_estructura_cumplidos, epr_estructura_total,
          epr_proceso_cumplidos, epr_proceso_total,
          epr_resultado_cumplidos, epr_resultado_total,
          observaciones } = req.body;
  if (!anio || !mes) return res.status(400).json({ error: 'anio y mes son requeridos' });

  const payload: any = {
    empresa_id: eid, anio: parseInt(String(anio)), mes: parseInt(String(mes)),
    num_trabajadores:  parseInt(String(num_trabajadores  || 0)),
    dias_laborales:    parseInt(String(dias_laborales    || 30)),
    num_at:            parseInt(String(num_at            || 0)),
    dias_perdidos_at:  parseInt(String(dias_perdidos_at  || 0)),
    dias_cargados_at:  parseInt(String(dias_cargados_at  || 0)),
    num_at_mortales:   parseInt(String(num_at_mortales   || 0)),
    casos_nuevos_el:   parseInt(String(casos_nuevos_el   || 0)),
    casos_antiguos_el: parseInt(String(casos_antiguos_el || 0)),
    dias_ausencia_laboral: parseInt(String(dias_ausencia_laboral || 0)),
    dias_ausencia_comun:   parseInt(String(dias_ausencia_comun   || 0)),
    epr_estructura_cumplidos: parseInt(String(epr_estructura_cumplidos || 0)),
    epr_estructura_total:     parseInt(String(epr_estructura_total     || 0)),
    epr_proceso_cumplidos:    parseInt(String(epr_proceso_cumplidos    || 0)),
    epr_proceso_total:        parseInt(String(epr_proceso_total        || 0)),
    epr_resultado_cumplidos:  parseInt(String(epr_resultado_cumplidos  || 0)),
    epr_resultado_total:      parseInt(String(epr_resultado_total      || 0)),
    observaciones: observaciones || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db.from('vigia_sgsst_mensual')
    .upsert(payload, { onConflict: 'empresa_id,anio,mes' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/sgsst-mensual/:id
vigiaRouter.put('/sgsst-mensual/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  const { id } = req.params;
  const { num_trabajadores, dias_laborales,
          num_at, dias_perdidos_at, dias_cargados_at, num_at_mortales,
          casos_nuevos_el, casos_antiguos_el,
          dias_ausencia_laboral, dias_ausencia_comun,
          epr_estructura_cumplidos, epr_estructura_total,
          epr_proceso_cumplidos, epr_proceso_total,
          epr_resultado_cumplidos, epr_resultado_total,
          observaciones } = req.body;

  const { data, error } = await db.from('vigia_sgsst_mensual').update({
    num_trabajadores:  parseInt(String(num_trabajadores  || 0)),
    dias_laborales:    parseInt(String(dias_laborales    || 30)),
    num_at:            parseInt(String(num_at            || 0)),
    dias_perdidos_at:  parseInt(String(dias_perdidos_at  || 0)),
    dias_cargados_at:  parseInt(String(dias_cargados_at  || 0)),
    num_at_mortales:   parseInt(String(num_at_mortales   || 0)),
    casos_nuevos_el:   parseInt(String(casos_nuevos_el   || 0)),
    casos_antiguos_el: parseInt(String(casos_antiguos_el || 0)),
    dias_ausencia_laboral: parseInt(String(dias_ausencia_laboral || 0)),
    dias_ausencia_comun:   parseInt(String(dias_ausencia_comun   || 0)),
    epr_estructura_cumplidos: parseInt(String(epr_estructura_cumplidos || 0)),
    epr_estructura_total:     parseInt(String(epr_estructura_total     || 0)),
    epr_proceso_cumplidos:    parseInt(String(epr_proceso_cumplidos    || 0)),
    epr_proceso_total:        parseInt(String(epr_proceso_total        || 0)),
    epr_resultado_cumplidos:  parseInt(String(epr_resultado_cumplidos  || 0)),
    epr_resultado_total:      parseInt(String(epr_resultado_total      || 0)),
    observaciones: observaciones || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('empresa_id', eid!).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No encontrado' });
  return res.json(data);
});

// ── Presupuesto SG-SST (F006 · ítem 1.1.3 Res. 0312) ─────────────────────────────────

// GET /api/vigia/presupuesto  — ítems del año
vigiaRouter.get('/presupuesto', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.query as any);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const anio = parseInt(String(req.query.anio || new Date().getFullYear()));
  const [{ data: items, error }, { data: meta }] = await Promise.all([
    db.from('vigia_presupuesto_item').select('*').eq('empresa_id', eid).eq('anio', anio).order('orden'),
    db.from('vigia_presupuesto_meta').select('*').eq('empresa_id', eid).eq('anio', anio).single(),
  ]);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: items || [], meta: meta || null });
});

// POST /api/vigia/presupuesto  — crear ítem
vigiaRouter.post('/presupuesto', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { anio, grupo, nombre, beneficio, orden, valores } = req.body;
  if (!anio || !grupo || !nombre) return res.status(400).json({ error: 'anio, grupo y nombre requeridos' });
  const { data, error } = await db.from('vigia_presupuesto_item').insert({
    empresa_id: eid, anio: parseInt(String(anio)), grupo, nombre,
    beneficio: beneficio || null, orden: parseInt(String(orden || 0)),
    valores: valores || {},
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PUT /api/vigia/presupuesto/:id  — actualizar ítem
vigiaRouter.put('/presupuesto/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  const { id } = req.params;
  const { nombre, beneficio, orden, valores } = req.body;
  const { data, error } = await db.from('vigia_presupuesto_item').update({
    nombre, beneficio: beneficio || null,
    orden: parseInt(String(orden || 0)), valores: valores || {},
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('empresa_id', eid!).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No encontrado' });
  return res.json(data);
});

// DELETE /api/vigia/presupuesto/:id
vigiaRouter.delete('/presupuesto/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.empresa_id || null;
  const { id } = req.params;
  const filter = sess.es_admin
    ? db.from('vigia_presupuesto_item').delete().eq('id', id)
    : db.from('vigia_presupuesto_item').delete().eq('id', id).eq('empresa_id', eid!);
  const { error } = await filter;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// PUT /api/vigia/presupuesto-meta  — guardar análisis/firmas (upsert)
vigiaRouter.put('/presupuesto-meta', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = empresaIdFrom(sess, req.body);
  if (!eid) return res.status(400).json({ error: 'empresa_id requerido' });
  const { anio, elaboro, reviso, analisis } = req.body;
  if (!anio) return res.status(400).json({ error: 'anio requerido' });
  const { data, error } = await db.from('vigia_presupuesto_meta')
    .upsert({ empresa_id: eid, anio: parseInt(String(anio)), elaboro: elaboro || null,
              reviso: reviso || null, analisis: analisis || null,
              updated_at: new Date().toISOString() }, { onConflict: 'empresa_id,anio' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/vigia/sgsst-mensual/:id
vigiaRouter.delete('/sgsst-mensual/:id', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const eid  = sess.empresa_id || null;
  const { id } = req.params;
  const filter = sess.es_admin
    ? db.from('vigia_sgsst_mensual').delete().eq('id', id)
    : db.from('vigia_sgsst_mensual').delete().eq('id', id).eq('empresa_id', eid!);
  const { error } = await filter;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

// POST /api/vigia/cartas/zip
// Body: { empleado_ids: string[] }
// Genera un ZIP con un PDF de carta de recomendaciones por empleado.
vigiaRouter.post('/cartas/zip', vigiaAuth, async (req: Request, res: Response) => {
  const db   = getDB();
  const sess = req.vigiaSession!;
  const { empleado_ids } = req.body as { empleado_ids: string[] };

  if (!Array.isArray(empleado_ids) || !empleado_ids.length) {
    return res.status(400).json({ error: 'empleado_ids requerido' });
  }

  // Fetch empleados con empresa
  const { data: empleados, error: empErr } = await db
    .from('vigia_empleados')
    .select('*, vigia_empresas(nombre, prefijo_docs, vigencia_docs_desde)')
    .in('id', empleado_ids);

  if (empErr || !empleados?.length) {
    return res.status(404).json({ error: 'Empleados no encontrados' });
  }

  // Verificar permisos: solo empleados de la empresa del usuario (si no es admin)
  if (!sess.es_admin) {
    const ajenos = (empleados as any[]).filter((e: any) => e.empresa_id !== sess.empresa_id);
    if (ajenos.length) return res.status(403).json({ error: 'Sin permisos sobre algunos empleados' });
  }

  // Fetch examenes para todos
  const { data: examenes } = await db
    .from('vigia_examenes')
    .select('*')
    .in('empleado_id', empleado_ids)
    .order('fecha', { ascending: false });

  const examenesByEmp: Record<string, any[]> = {};
  for (const ex of (examenes || [])) {
    (examenesByEmp[ex.empleado_id] = examenesByEmp[ex.empleado_id] || []).push(ex);
  }

  // Preparar ZIP
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="cartas_recomendaciones.zip"');

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.pipe(res);

  for (const emp of (empleados as any[])) {
    const exsList = examenesByEmp[emp.id] || [];
    if (!exsList.length) continue;

    const examen = mergeExamenesMismaFecha(exsList);
    if (!examen) continue;

    const empresa       = emp.vigia_empresas?.nombre              || 'Empresa';
    const prefijoDocs   = emp.vigia_empresas?.prefijo_docs         || 'SG-SST';
    const vigenciaDesde = emp.vigia_empresas?.vigencia_docs_desde  || null;

    const pdfBuffer = await generarCartaPDF({ empresa, prefijoDocs, vigenciaDesde, emp, examen });

    const slug = (emp.nombre as string)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    archive.append(pdfBuffer, { name: `Carta_${slug}.pdf` });
  }

  await archive.finalize();
});
