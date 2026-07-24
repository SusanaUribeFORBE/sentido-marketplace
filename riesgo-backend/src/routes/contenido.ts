import { Router, Request, Response } from 'express';

export const contenidoRouter = Router();

// ── System prompt dinámico con perfil de marca + restricciones ──
function buildSystemPrompt(nombre: string, sector: string, tono: string, publico: string): string {
  return `Eres un experto en marketing digital para negocios en Colombia y Latinoamérica.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.

PERFIL DE MARCA (aplica en todas las generaciones):
• Marca: ${nombre}
• Sector: ${sector || 'General'}
• Tono: ${tono || 'Cercano y profesional'}
• Público: ${publico || 'Emprendedores colombianos'}

RESTRICCIONES — nunca uses:
• Frases cliché: "en un mundo donde", "hoy más que nunca", "sin duda", "no te pierdas", "te invitamos a", "únete a nosotros"
• Más de 3 emojis por texto (solo si el tono es informal o desenfadado)
• Hashtags genéricos: #Emprendimiento #Éxito #Motivación #Negocios #Emprender
• Lenguaje corporativo frío que no refleje la voz propia de la marca
• Promesas vacías sin sustento concreto`;
}

// ── Ángulos fijos por opción ──
const ANGULOS: Record<number, string> = {
  1: 'EMOCIONAL — conecta con una emoción real y específica (nostalgia, orgullo de origen, identidad, transformación personal). Usa lenguaje íntimo y sensorial. Narra desde la experiencia del cliente, no de la marca.',
  2: 'PRUEBA SOCIAL / DATO — incluye un número concreto, resultado medible, testimonio específico o comparación que genera credibilidad. El lector debe sentir que otros ya lo validan.',
  3: 'URGENCIA / BENEFICIO DIRECTO — comunica un beneficio inmediato y tangible, o una razón clara y concreta para actuar ahora. Sin rodeos. El valor debe quedar claro en la primera línea.',
};

// ── Esquemas JSON por tipo ──
const ESQUEMA_POST = {
  id: 1,
  titulo: "nombre corto del enfoque (máx 5 palabras)",
  por_que: "en una línea: por qué este ángulo conecta con esta audiencia específica",
  gancho: "primeras 1-2 líneas de alto impacto — captura atención en los primeros 2 segundos",
  cuerpo: "desarrollo principal: narrativa, dato o beneficio según el ángulo asignado",
  cta: "llamada a la acción directa y concreta (qué debe hacer el lector ahora mismo)",
  hashtags: ["hashtag1", "hashtag2", "hashtag3"],
};

const ESQUEMA_REEL = {
  id: 1,
  titulo: "nombre corto del enfoque",
  por_que: "en una línea: por qué este ángulo genera engagement en video",
  guion: [
    { sec: "GANCHO", duracion: "0–3s", visual: "qué se ve / qué hace el creador en pantalla", audio: "qué se dice o escucha" },
    { sec: "DESARROLLO", duracion: "4–20s", visual: "qué se muestra o hace", audio: "narración o diálogo principal" },
    { sec: "CTA", duracion: "21–25s", visual: "qué se ve al final", audio: "llamada a la acción" },
  ],
  hashtags: ["hashtag1", "hashtag2"],
};

const ESQUEMA_CARRUSEL = {
  id: 1,
  titulo: "nombre corto del enfoque",
  por_que: "en una línea: por qué este carrusel genera guardados o compartidos",
  slides: [
    { n: 1, tipo: "Portada / Gancho", titulo: "título impactante (máx 8 palabras)", texto: "subtítulo o promesa concreta" },
    { n: 2, tipo: "Problema / Contexto", titulo: "encabezado del slide", texto: "contenido del slide" },
    { n: 3, tipo: "Solución / Desarrollo", titulo: "encabezado del slide", texto: "contenido del slide" },
    { n: 4, tipo: "Prueba social / Beneficio", titulo: "encabezado del slide", texto: "contenido del slide" },
    { n: 5, tipo: "CTA", titulo: "cierre que invita a actuar", texto: "qué debe hacer el lector" },
  ],
  hashtags: ["hashtag1", "hashtag2"],
};

const ESQUEMA_HISTORIA = {
  id: 1,
  titulo: "nombre corto del enfoque",
  por_que: "en una línea: por qué este enfoque genera respuestas en historia",
  gancho: "texto de primera pantalla: máx 6 palabras, impacto visual inmediato",
  texto: "texto principal de la historia: máx 2 líneas, directo y emocional",
  cta: "texto del botón de acción o desliza hacia arriba",
  sticker: "sugerencia de sticker de Instagram (encuesta, pregunta, cuenta regresiva, emoji slider)",
  hashtags: [],
};

const ESQUEMA_HILO = {
  id: 1,
  titulo: "nombre corto del enfoque",
  por_que: "en una línea: por qué este hilo retiene hasta el final",
  posts: [
    { n: 1, total: 6, texto: "gancho que genera curiosidad o tensión — promete algo valioso" },
    { n: 2, total: 6, texto: "primer punto de desarrollo o contexto" },
    { n: 3, total: 6, texto: "segundo punto: ejemplo concreto o dato inesperado" },
    { n: 4, total: 6, texto: "tercer punto o giro narrativo que sorprende" },
    { n: 5, total: 6, texto: "síntesis o conclusión aplicable" },
    { n: 6, total: 6, texto: "CTA final + invitación a compartir o seguir" },
  ],
  hashtags: ["hashtag1", "hashtag2"],
};

const ESQUEMAS: Record<string, object> = {
  'Post':          ESQUEMA_POST,
  'Reel / TikTok': ESQUEMA_REEL,
  'Carrusel':      ESQUEMA_CARRUSEL,
  'Historia':      ESQUEMA_HISTORIA,
  'Hilo':          ESQUEMA_HILO,
};

const INSTRUCCIONES_PLATAFORMA: Record<string, string> = {
  Instagram:          'Caption máx 2200 caracteres. Incluir 5-8 hashtags específicos (no genéricos).',
  TikTok:             'Caption máx 300 caracteres. Gancho visual en los primeros 2 segundos de video. 3-5 hashtags.',
  LinkedIn:           'Tono profesional. Datos y logros concretos. Máx 1500 caracteres. Sin hashtags genéricos (máx 3 muy específicos).',
  Facebook:           'Conversacional y emocional. Un solo CTA claro. Máx 500 caracteres.',
  'WhatsApp Business':'Directo y personal. Sin hashtags. CTA de respuesta inmediata (ej: "Respóndeme este mensaje"). Máx 300 caracteres.',
};

const MODELOS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
];

// ── POST /api/contenido/generar ──
contenidoRouter.post('/generar', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, plataforma, tipo, tema, objetivo, colores } = req.body;
  if (!nombre || !plataforma || !tema) {
    return res.status(400).json({ error: 'Faltan campos: nombre, plataforma, tema' });
  }

  const sistemaPrompt   = buildSystemPrompt(nombre, sector, tono, publico);
  const instrPlataforma = INSTRUCCIONES_PLATAFORMA[plataforma] || 'Adapta el texto a la plataforma.';
  const esquema = ESQUEMAS[tipo] || ESQUEMAS['Post'];

  const op1 = JSON.stringify({ ...esquema, id: 1 }, null, 2);
  const op2 = JSON.stringify({ ...esquema, id: 2 }, null, 2);
  const op3 = JSON.stringify({ ...esquema, id: 3 }, null, 2);

  const colorHint = colores?.primario
    ? `Brand color palette — primary: ${colores.primario}${colores.secundario ? `, secondary: ${colores.secundario}` : ''}. Incorporate these colors naturally as the dominant palette of the composition.`
    : 'cinematic, brand-consistent';

  const prompt = `Genera 3 opciones de contenido para:
RED SOCIAL: ${plataforma} — ${instrPlataforma}
TIPO: ${tipo || 'Post'}
TEMA DEL DÍA: ${tema}
OBJETIVO: ${objetivo || 'Conectar con la audiencia'}
${colores?.primario ? `COLORES DE MARCA: primario ${colores.primario}${colores.secundario ? `, secundario ${colores.secundario}` : ''} (menciónalos si el contenido habla de la identidad visual)` : ''}

ÁNGULO OBLIGATORIO POR OPCIÓN (cada una debe ser notablemente diferente):
• Opción 1 (id: 1) → ${ANGULOS[1]}
• Opción 2 (id: 2) → ${ANGULOS[2]}
• Opción 3 (id: 3) → ${ANGULOS[3]}

Rellena CADA campo con contenido real — sin placeholders. El prompt_imagen en inglés.

JSON de respuesta (sin markdown, sin texto adicional):
{
  "opciones": [
    ${op1},
    ${op2},
    ${op3}
  ],
  "prompt_imagen": "detailed English image prompt for Midjourney/DALL-E — ${colorHint}"
}`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.85, max_tokens: 4500,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        lastError = await resp.text();
        console.error(`[contenido/generar] ${model} HTTP error:`, lastError.slice(0, 200));
        continue;
      }

      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `Sin JSON de ${model}`;
        console.error('[contenido/generar]', lastError, contenido.slice(0, 100));
        continue;
      }

      console.log(`[contenido/generar] OK | modelo: ${model} | tipo: ${tipo} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[contenido/generar] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo generar el contenido', detalle: lastError });
});

// ── POST /api/contenido/regenerar ──
// Regenera UNA sola opción con un ángulo específico
contenidoRouter.post('/regenerar', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, plataforma, tipo, tema, objetivo, angulo } = req.body;
  if (!nombre || !plataforma || !tema) return res.status(400).json({ error: 'Faltan campos' });

  const anguloNum   = Math.min(3, Math.max(1, Number(angulo) || 1));
  const anguloTexto = ANGULOS[anguloNum];
  const sistemaPrompt   = buildSystemPrompt(nombre, sector, tono, publico);
  const instrPlataforma = INSTRUCCIONES_PLATAFORMA[plataforma] || '';
  const esquema = ESQUEMAS[tipo] || ESQUEMAS['Post'];

  const prompt = `Genera UNA SOLA opción de contenido con el siguiente ángulo obligatorio:

ÁNGULO: ${anguloTexto}

RED SOCIAL: ${plataforma} — ${instrPlataforma}
TIPO: ${tipo || 'Post'}
TEMA: ${tema}
OBJETIVO: ${objetivo || 'Conectar con la audiencia'}

Rellena CADA campo con contenido real — sin placeholders.

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto adicional):
${JSON.stringify({ ...esquema, id: anguloNum }, null, 2)}`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.9, max_tokens: 2000,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });

      if (!resp.ok) { lastError = await resp.text(); continue; }

      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { lastError = `Sin JSON de ${model}`; continue; }

      console.log(`[contenido/regenerar] OK | modelo: ${model} | ángulo: ${anguloNum} | tokens: ${tokens}`);
      return res.json({ opcion: JSON.parse(jsonMatch[0]) });
    } catch (err: any) {
      lastError = err.message;
    }
  }

  return res.status(502).json({ error: 'No se pudo regenerar', detalle: lastError });
});

// ── Mapeo formato → image_size de fal.ai flux/schnell ──
const FAL_SIZES: Record<string, string> = {
  cuadrado:   'square_hd',
  horizontal: 'landscape_4_3',
  vertical:   'portrait_4_3',
};

// ── POST /api/contenido/pauta ──
// Genera presupuesto de pauta digital en COP por plataforma
contenidoRouter.post('/pauta', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, meta, redes, publico } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta nombre' });

  const sistemaPrompt = `Eres un experto en publicidad digital para pequeñas empresas en Colombia. Conoces los precios reales del mercado colombiano en 2024-2025. Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.`;

  const redesList = Array.isArray(redes) ? redes.join(', ') : (redes || 'Instagram');

  const prompt = `Crea un presupuesto de pauta digital mensual en pesos colombianos (COP) para:

MARCA: ${nombre}
SECTOR: ${sector || 'General'}
META: ${meta || 'Conseguir clientes nuevos'}
PÚBLICO: ${publico || 'Colombianos'}
PLATAFORMAS DONDE ESTÁ EL CLIENTE: ${redesList}

Usa precios reales del mercado colombiano 2025. Para negocios pequeños, los CPM en Colombia rondan:
- Meta (Instagram/Facebook): COP 3.000–8.000 por 1.000 impresiones
- TikTok: COP 5.000–12.000 por 1.000 impresiones
- LinkedIn: COP 15.000–35.000 por 1.000 impresiones

Da exactamente 3 niveles para el presupuesto total mensual y por plataforma.

Devuelve EXACTAMENTE este JSON:
{
  "contexto": "1-2 líneas sobre por qué pautar tiene sentido para esta marca en este momento",
  "antes_de_pautar": "condición mínima que debe cumplir antes de invertir (ej: tener 9+ posts, perfil completo, etc.)",
  "total_mensual": { "minimo": "COP X", "recomendado": "COP X", "agresivo": "COP X" },
  "plataformas": [
    {
      "red": "Instagram",
      "objetivo_campana": "Alcance / Tráfico / Conversiones",
      "formato": "Reels Ads o Post boosteado",
      "minimo": "COP X/mes",
      "recomendado": "COP X/mes",
      "resultado_esperado": "qué logra con el presupuesto recomendado (alcance, clics, leads estimados)",
      "consejo": "tip concreto para esta plataforma y este sector"
    }
  ],
  "regla_de_oro": "una regla práctica y memorable sobre cómo invertir en pauta siendo emprendedor"
}

Solo incluye en "plataformas" las redes mencionadas en PLATAFORMAS DONDE ESTÁ EL CLIENTE.`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.7, max_tokens: 1500,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });
      if (!resp.ok) { lastError = await resp.text(); continue; }
      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { lastError = `Sin JSON de ${model}`; continue; }
      console.log(`[contenido/pauta] OK | modelo: ${model} | marca: ${nombre} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) { lastError = err.message; }
  }
  return res.status(502).json({ error: 'No se pudo generar el presupuesto', detalle: lastError });
});

// ── POST /api/contenido/whatsapp ──
// Genera 5 scripts de respuesta para WhatsApp adaptados al post y la marca
contenidoRouter.post('/whatsapp', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, tema, gancho } = req.body;
  if (!nombre || !tema) return res.status(400).json({ error: 'Faltan campos: nombre, tema' });

  const sistemaPrompt = `Eres un experto en ventas por WhatsApp para pequeños negocios en Colombia y Latinoamérica.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.`;

  const prompt = `Crea 5 scripts de respuesta de WhatsApp listos para copiar y pegar para:

MARCA: ${nombre}
SECTOR: ${sector || 'General'}
TONO: ${tono || 'Cercano y cálido'}
PÚBLICO: ${publico || 'Colombianos'}
PRODUCTO/TEMA DEL POST: ${tema}
${gancho ? `GANCHO DEL POST: ${gancho}` : ''}

Las 5 preguntas deben ser las MÁS COMUNES que recibe este tipo de negocio por WhatsApp (adaptadas al sector, no genéricas).
Cada respuesta debe:
- Sonar natural y cálida, nunca robótica ni corporativa
- Tener máximo 3 líneas
- Cerrar con una micro-pregunta que avance la venta (ej: "¿Te lo separamos?", "¿Te envío más fotos?")
- No usar: "Con gusto", "Cordialmente", "¡Hola! Bienvenido/a"
- Sí usar: el nombre del producto o servicio, emojis con criterio (máx 1 por mensaje)

Devuelve EXACTAMENTE este JSON:
{
  "scripts": [
    { "pregunta": "pregunta real del cliente", "respuesta": "respuesta completa lista para enviar" },
    { "pregunta": "...", "respuesta": "..." },
    { "pregunta": "...", "respuesta": "..." },
    { "pregunta": "...", "respuesta": "..." },
    { "pregunta": "...", "respuesta": "..." }
  ]
}`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.8, max_tokens: 1200,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });
      if (!resp.ok) { lastError = await resp.text(); continue; }
      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { lastError = `Sin JSON de ${model}`; continue; }
      console.log(`[contenido/whatsapp] OK | modelo: ${model} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
    }
  }
  return res.status(502).json({ error: 'No se pudo generar el kit', detalle: lastError });
});

// ── POST /api/contenido/plan-mensual ──
// Genera un plan de 30 días con regla 80/20 (valor vs venta)
contenidoRouter.post('/plan-mensual', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, tiempo, meta, donde_cliente } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la marca' });

  const totalMap: Record<string, number> = {
    '15-30 minutos por semana': 8,
    '1 hora por semana': 16,
    '30+ minutos por día': 20,
  };
  const total = totalMap[tiempo || '1 hora por semana'] || 16;
  const totalValor = Math.round(total * 0.8);
  const totalVenta = total - totalValor;

  const sistemaPrompt = `Eres un estratega de marketing digital para pequeños negocios colombianos.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.`;

  const prompt = `Crea un plan de contenido para 30 días (4 semanas) para:

MARCA: ${nombre}
SECTOR: ${sector || 'General'}
TONO: ${tono || 'Cercano y profesional'}
PÚBLICO: ${publico || 'Colombianos'}
META: ${meta || 'Conseguir clientes nuevos'}
PLATAFORMAS: ${donde_cliente || 'Instagram'}

TOTAL: ${total} publicaciones — OBLIGATORIO aplicar regla 80/20:
• ${totalValor} posts de VALOR (categorías: Educativo, Detrás de cámaras, Entretenimiento, Solución de problema, Historia de cliente)
• ${totalVenta} posts de VENTA (categorías: Oferta directa, Promoción, Testimonio de venta, Lanzamiento)

Los temas deben ser CONCRETOS para esta marca, no genéricos.
Distribuye los posts de venta separados (no dos seguidos).
Usa máximo 2 plataformas de las indicadas.

Devuelve EXACTAMENTE este JSON:
{
  "resumen": "descripción del mes en 1 línea",
  "total_valor": ${totalValor},
  "total_venta": ${totalVenta},
  "plan": [
    { "semana": 1, "n": 1, "dia": "Lunes", "red": "Instagram", "tipo": "Post", "categoria": "valor", "subcategoria": "Educativo", "tema": "tema concreto", "objetivo": "Conocimiento de marca" }
  ]
}

Genera exactamente ${total} items en el array plan.`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.75, max_tokens: 4000,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });
      if (!resp.ok) { lastError = await resp.text(); console.error(`[contenido/plan-mensual] ${model} error:`, lastError.slice(0,200)); continue; }
      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { lastError = `Sin JSON de ${model}`; continue; }
      console.log(`[contenido/plan-mensual] OK | modelo: ${model} | marca: ${nombre} | posts: ${total} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
    }
  }
  return res.status(502).json({ error: 'No se pudo generar el plan mensual', detalle: lastError });
});

// ── POST /api/contenido/estrategia ──
// Genera un plan de contenido semanal a partir de diagnóstico de 3 preguntas
contenidoRouter.post('/estrategia', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, tiempo, meta, donde_cliente } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la marca' });

  const sistemaPrompt = `Eres un estratega de marketing digital especializado en pequeñas empresas y emprendimientos colombianos.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.`;

  const prompt = `Crea un plan de contenido semanal personalizado para:

MARCA: ${nombre}
SECTOR: ${sector || 'General'}
TONO: ${tono || 'Cercano y profesional'}
PÚBLICO: ${publico || 'Emprendedores colombianos'}
TIEMPO DISPONIBLE: ${tiempo || '1 hora/semana'}
META PRINCIPAL: ${meta || 'Conseguir clientes nuevos'}
DONDE ESTÁ EL CLIENTE: ${donde_cliente || 'Instagram'}

REGLAS:
• Recomienda máximo 2 redes sociales — enfocado es mejor que disperso.
• El número de posts del plan debe ser proporcional al tiempo disponible (15-30 min → 2 posts, 1h → 3-4 posts, diario → 5-6 posts).
• Cada tema debe ser CONCRETO y específico para esta marca, NO genérico ("¿Cuánto tiempo llevas sin...?" o "El error más común en moda..." no sirven — ponlo específico al sector/producto).
• Los días del plan deben ser específicos (Lunes, Miércoles, Viernes — no "Día 1").
• Las redes en el plan deben ser SOLO las redes_recomendadas.

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto adicional):
{
  "redes_recomendadas": ["Red1", "Red2"],
  "frecuencia": "X publicaciones por semana",
  "razon": "2-3 líneas explicando por qué estas redes y esta frecuencia, específico para esta marca y su cliente",
  "plan": [
    { "dia": "Lunes", "red": "Instagram", "tipo": "Post", "tema": "tema concreto para esta marca", "objetivo": "Conocimiento de marca", "por_que": "una línea conectando esta elección con la meta y tono del emprendedor — ej: 'Elegimos esto porque tu meta es conseguir clientes y el tono cercano genera confianza inmediata'" }
  ],
  "consejo": "Un consejo accionable y específico para esta marca en este momento — no genérico"
}`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.75, max_tokens: 1500,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        lastError = await resp.text();
        console.error(`[contenido/estrategia] ${model} HTTP error:`, lastError.slice(0, 200));
        continue;
      }

      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `Sin JSON de ${model}`;
        console.error('[contenido/estrategia]', lastError, contenido.slice(0, 100));
        continue;
      }

      console.log(`[contenido/estrategia] OK | modelo: ${model} | marca: ${nombre} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[contenido/estrategia] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo generar la estrategia', detalle: lastError });
});

// ── POST /api/contenido/masiva ──
// Genera una biblioteca de 30 piezas de contenido listas para producir
contenidoRouter.post('/masiva', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, enfoque, meta, descripcion_negocio, ceo_mode } = req.body;

  // En modo CEO, descripcion_negocio reemplaza los campos estructurados
  const nombreFinal  = nombre || (descripcion_negocio ? descripcion_negocio.split(' ').slice(0,4).join(' ') : '');
  if (!nombreFinal) return res.status(400).json({ error: 'Falta el nombre o descripción del negocio' });

  const contextoMarca = ceo_mode && descripcion_negocio
    ? `DESCRIPCIÓN DEL NEGOCIO (el emprendedor no completó el perfil): ${descripcion_negocio}`
    : `MARCA: ${nombreFinal}
SECTOR: ${sector || 'General'}
TONO: ${tono || 'Cercano y cálido'}
PÚBLICO: ${publico || 'Emprendedores colombianos'}`;

  const sistemaPrompt = `Eres el director de contenidos de una agencia de marketing digital especializada en pequeñas empresas colombianas.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.
Cuando detectes la industria desde la descripción del negocio, adapta el contenido con terminología específica del sector.`;

  const prompt = `Crea una biblioteca de 30 piezas de contenido para redes sociales:

${contextoMarca}
META DEL EMPRENDEDOR: ${meta || 'Conseguir clientes nuevos'}
ENFOQUE / CAMPAÑA: ${enfoque || 'Contenido general de posicionamiento y ventas'}

DISTRIBUCIÓN OBLIGATORIA (30 piezas en total):
- 8 Posts de VALOR (educativos, consejos, datos, detrás de cámaras)
- 5 Posts de VENTA (oferta, testimonio, resultado, promoción)
- 7 Reels / TikTok (videos cortos virales o educativos)
- 5 Carruseles (multi-slide, alta retención y guardados)
- 3 Historias (encuestas, preguntas, countdowns, stickers)
- 2 Campañas (concepto de campaña completa de 5-7 días)

REGLAS DE CONTENIDO:
• Cada tema 100% específico — NADA genérico.
• Títulos concretos: qué ve/aprende/siente el usuario.
• Varía ángulos: emocional, dato sorprendente, utilidad, urgencia.
• Adapta la distribución valor/venta a la meta del emprendedor.

PUNTUACIÓN POR PIEZA (de 1 a 10, basada en el tipo, formato y ángulo):
• viralidad: probabilidad de que se comparta o viralice
• conversion: probabilidad de generar una venta o lead
• engagement (interacción): probabilidad de comentarios, guardados o likes
• facilidad: qué tan fácil es producirlo sin equipo profesional

Devuelve EXACTAMENTE este JSON (sin markdown ni texto adicional):
{
  "resumen": "una línea describiendo el enfoque de esta biblioteca",
  "total": 30,
  "items": [
    {
      "id": 1,
      "tipo": "Post",
      "categoria": "valor",
      "subcategoria": "Educativo",
      "titulo": "título concreto del contenido (máx 8 palabras)",
      "concepto": "en una línea: qué muestra o enseña este contenido",
      "gancho": "primera línea de enganche (máx 12 palabras)",
      "objetivo": "lo que busca lograr en el lector",
      "plataforma": "Instagram",
      "viralidad": 8,
      "conversion": 5,
      "engagement": 7,
      "facilidad": 9
    }
  ]
}

Los tipos válidos son: Post, Reel / TikTok, Carrusel, Historia, Campaña
Las categorías válidas son: valor, venta`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.8, max_tokens: 4500,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        lastError = await resp.text();
        console.error(`[contenido/masiva] ${model} HTTP error:`, lastError.slice(0, 200));
        continue;
      }

      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `Sin JSON de ${model}`;
        console.error('[contenido/masiva]', lastError, contenido.slice(0, 100));
        continue;
      }

      console.log(`[contenido/masiva] OK | modelo: ${model} | marca: ${nombre} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[contenido/masiva] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo generar la biblioteca', detalle: lastError });
});

// ── POST /api/contenido/diagnostico ──
// Analiza la descripción del negocio y devuelve un perfil de marca en < 2 segundos
contenidoRouter.post('/diagnostico', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { descripcion } = req.body;
  if (!descripcion || descripcion.length < 10) return res.status(400).json({ error: 'Descripción demasiado corta' });

  const prompt = `Analiza esta descripción de negocio y extrae un perfil de marca:

"${descripcion}"

Devuelve EXACTAMENTE este JSON (sin markdown):
{
  "sector": "nombre del sector (máx 4 palabras)",
  "cliente_ideal": "descripción del cliente ideal (1 línea)",
  "tono": "uno de: Cercano y cálido | Profesional y serio | Inspirador y motivador | Educativo y experto | Emocional y humano | Divertido y desenfadado",
  "temas": ["tema1", "tema2", "tema3", "tema4"],
  "estrategia": { "educacion": 60, "autoridad": 25, "ventas": 15 },
  "oportunidad": "una observación específica sobre qué tipo de contenido le falta o debería priorizar (1 línea)",
  "nombre_sugerido": "nombre probable del negocio o null si no se puede inferir"
}`;

  for (const model of ['llama-3.1-8b-instant', ...MODELOS]) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.3, max_tokens: 350,
          messages: [
            { role: 'system', content: 'Eres un experto en marketing digital. Devuelves ÚNICAMENTE JSON válido.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!resp.ok) continue;
      const data = await resp.json() as any;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      return res.json(JSON.parse(jsonMatch[0]));
    } catch {}
  }
  return res.status(502).json({ error: 'No se pudo analizar el negocio' });
});

// ── POST /api/contenido/analizar-url ──
// Extrae info de una web o perfil público y devuelve perfil de marca
contenidoRouter.post('/analizar-url', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL' });

  if (!url.startsWith('http')) url = 'https://' + url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const pageResp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CREABot/1.0)' },
    }).finally(() => clearTimeout(timeout));

    if (!pageResp.ok) return res.status(422).json({ error: `No se pudo acceder a ${url}` });

    const html = await pageResp.text();

    // Extraer texto relevante
    const getTag = (tag: string) => html.match(new RegExp(`<meta[^>]+name=["']${tag}["'][^>]+content=["']([^"']+)`, 'i'))?.[1] || '';
    const getOg  = (prop: string) => html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)`, 'i'))?.[1] || '';
    const title  = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';

    const extracto = [
      title,
      getOg('title'), getOg('description'), getOg('site_name'),
      getTag('description'), getTag('keywords'),
    ].filter(Boolean).join(' | ').slice(0, 1500);

    if (!extracto.trim()) return res.status(422).json({ error: 'No se pudo extraer información de esa página' });

    const prompt = `Analiza esta información extraída de una página web de negocio:

"${extracto}"
URL: ${url}

Devuelve EXACTAMENTE este JSON:
{
  "nombre": "nombre del negocio",
  "sector": "sector (máx 4 palabras)",
  "cliente_ideal": "descripción del cliente ideal (1 línea)",
  "tono": "uno de: Cercano y cálido | Profesional y serio | Inspirador y motivador | Educativo y experto | Emocional y humano",
  "temas": ["tema1", "tema2", "tema3", "tema4"],
  "estrategia": { "educacion": 60, "autoridad": 25, "ventas": 15 },
  "oportunidad": "qué tipo de contenido debería priorizar (1 línea)"
}`;

    for (const model of ['llama-3.1-8b-instant', ...MODELOS]) {
      try {
        const aiResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model, temperature: 0.3, max_tokens: 350,
            messages: [
              { role: 'system', content: 'Devuelves ÚNICAMENTE JSON válido.' },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (!aiResp.ok) continue;
        const data = await aiResp.json() as any;
        const contenido = data.choices?.[0]?.message?.content || '';
        const jsonMatch = contenido.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        console.log(`[analizar-url] OK | url: ${url}`);
        return res.json(JSON.parse(jsonMatch[0]));
      } catch {}
    }
    return res.status(502).json({ error: 'No se pudo analizar la página' });

  } catch (err: any) {
    if (err.name === 'AbortError') return res.status(408).json({ error: 'Tiempo de espera agotado. Verifica que la URL sea pública.' });
    return res.status(422).json({ error: 'No se pudo acceder a esa URL: ' + err.message });
  }
});

// ── POST /api/contenido/chat ──
// Asistente conversacional de CREA — guía al emprendedor hacia el módulo correcto
contenidoRouter.post('/chat', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { mensajes = [], marca, pagina_actual } = req.body;
  if (!mensajes.length) return res.status(400).json({ error: 'Sin mensajes' });

  const marcaCtx = marca?.nombre
    ? `NEGOCIO: ${marca.nombre} | Sector: ${marca.sector || 'no especificado'} | Tono: ${marca.tono || 'no especificado'} | Público: ${marca.publico || 'no especificado'}`
    : 'El emprendedor aún no ha configurado su perfil de marca en CREA.';

  const paginaCtx = pagina_actual
    ? `PÁGINA ACTIVA: ${pagina_actual}`
    : '';

  // Detectar intención especial "¿qué hago hoy?"
  const ultimoMensaje = mensajes[mensajes.length - 1]?.contenido?.toLowerCase() || '';
  const esHoy = ultimoMensaje.includes('hago hoy') || ultimoMensaje.includes('debería hacer hoy') || ultimoMensaje.includes('qué hago hoy');

  const instruccionHoy = esHoy ? `
INSTRUCCIÓN ESPECIAL — el emprendedor quiere saber qué hacer HOY:
Genera un mini-plan de acción para hoy: 3-4 tareas muy concretas y rápidas (5-15 min cada una), ordenadas por prioridad. Incluye tiempo estimado total. Personaliza según su negocio y la página donde está. Termina con "Tiempo total estimado: X minutos." Tono motivador y directo.` : '';

  const sistemaPrompt = `Eres CREA, el estratega de marketing digital de la plataforma CREA. No eres un chatbot genérico — eres un copiloto que conoce el negocio del emprendedor y actúa de forma proactiva, como un director de marketing en tiempo real.

${marcaCtx}
${paginaCtx}

MÓDULOS DE CREA:
1. 🧭 Estrategia — /contenido/estrategia.html — Plan semanal personalizado por red social y tipo de contenido.
2. 📅 Plan del mes — /contenido/plan-mensual.html — Calendario 30 días (80% valor / 20% venta) con horarios y presupuesto.
3. ✨ Generar contenido — /contenido/generar.html — Un post/reel/carrusel/historia completo al instante.
   Parámetros: ?plataforma=Instagram&tipo=Reel&tema=El+tema&tono=inspiracional
4. 🚀 Masiva — /contenido/masiva.html — Biblioteca de 15-50 piezas con scores de viralidad, conversión y engagement.
   Parámetros: ?enfoque=El+enfoque
5. 🎨 Manual de Marca — /contenido/manual-marca.html — Identidad de marca completa: colores, tipografía, voz, pilares, taglines y bios para redes.

COMPORTAMIENTO DE COPILOTO CONTEXTUAL:
- Si el emprendedor está en ESTRATEGIA y no ha definido su público: sugiere definirlo para mejorar la calidad de las piezas.
- Si está en PLAN DEL MES y tiene solo contenido de venta: recomienda añadir educativo para mejorar alcance.
- Si está en MASIVA y pide contenido más técnico/emocional/de humor: dile que lo ajuste en el campo "Tono" o "Descripción".
- Si está en GENERAR: ayúdale a refinar el tema o plataforma con preguntas rápidas.
- Proactivo: si detectas que falta algo importante (público, plataforma, objetivo), coméntalo antes de que pregunten.

REGLAS ESTRICTAS:
- Tutea siempre. Español colombiano. Cálido y profesional.
- Máximo 4 líneas en el texto. Sé directo — no expliques lo que ya sabe.
- Una sola pregunta por respuesta (máximo).
- Personaliza las URLs con parámetros concretos cuando sea posible.
- Máximo 3 acciones por respuesta. Acciones solo cuando tengas contexto suficiente para ser útil.
- Nunca digas "como asistente de IA" ni des consejos de ChatGPT genérico.
${instruccionHoy}

FORMATO — devuelve ÚNICAMENTE este JSON válido:
{
  "texto": "respuesta corta, líneas separadas con \\n",
  "acciones": [
    { "icono": "emoji", "titulo": "hasta 5 palabras", "descripcion": "qué hace allí", "url": "/contenido/modulo.html", "tipo": "primary" }
  ]
}
acciones puede ser [].`;

  // Convertir historial al formato Groq
  const groqMessages = [
    { role: 'system', content: sistemaPrompt },
    ...mensajes.map((m: any) => ({ role: m.rol === 'asistente' ? 'assistant' : 'user', content: m.contenido })),
  ];

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.7, max_tokens: 800,
          messages: groqMessages,
        }),
      });

      if (!resp.ok) {
        lastError = await resp.text();
        console.error(`[contenido/chat] ${model} HTTP error:`, lastError.slice(0, 200));
        continue;
      }

      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Si no hay JSON, devolver el texto como está
        console.warn(`[contenido/chat] sin JSON de ${model}, usando texto plano`);
        return res.json({ texto: contenido.trim(), acciones: [] });
      }

      console.log(`[contenido/chat] OK | modelo: ${model} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[contenido/chat] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo procesar el mensaje', detalle: lastError });
});

// ── POST /api/contenido/manual-marca ──
contenidoRouter.post('/manual-marca', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { nombre, sector, tono, publico, productos, palabras_clave, diferenciador } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la marca' });

  const sistemaPrompt = `Eres un experto en branding y estrategia de marca para emprendimientos colombianos y latinoamericanos.
Devuelves ÚNICAMENTE JSON válido, sin texto adicional ni bloques markdown.
Todos los textos en español. Los colores deben ser específicos y únicos para esta marca, nunca genéricos.`;

  const prompt = `Crea un manual de marca profesional para:

MARCA: ${nombre}
SECTOR: ${sector || 'General'}
TONO: ${tono || 'Cercano y profesional'}
PÚBLICO OBJETIVO: ${publico || 'Emprendedores colombianos'}
PRODUCTOS/SERVICIOS: ${productos || 'No especificado'}
${palabras_clave ? `PALABRAS QUE DEFINEN LA MARCA: ${palabras_clave}` : ''}
${diferenciador ? `DIFERENCIADOR: ${diferenciador}` : ''}

Los colores deben ser únicos y específicos para esta marca. Los ejemplos deben ser reales para este negocio.

Devuelve EXACTAMENTE este JSON:
{
  "posicionamiento": "Para [público] que [necesidad], [marca] es [categoría] que [beneficio único]. Máx 2 líneas.",
  "promesa": "La promesa central de la marca en máx 12 palabras — qué garantiza a sus clientes",
  "personalidad": ["adjetivo1", "adjetivo2", "adjetivo3", "adjetivo4", "adjetivo5"],
  "arquetipo": "uno de: El Creador, El Sabio, El Héroe, El Amigo, El Explorador, El Cuidador, El Rebelde, El Mago",
  "colores": [
    { "nombre": "nombre del color", "hex": "#XXXXXX", "rgb": "R, G, B", "uso": "cuándo y dónde usarlo", "emocion": "qué transmite" },
    { "nombre": "nombre del color", "hex": "#XXXXXX", "rgb": "R, G, B", "uso": "cuándo y dónde usarlo", "emocion": "qué transmite" },
    { "nombre": "nombre del color", "hex": "#XXXXXX", "rgb": "R, G, B", "uso": "cuándo y dónde usarlo", "emocion": "qué transmite" }
  ],
  "tipografia": {
    "titular": { "nombre": "Nombre fuente", "peso": "Bold / ExtraBold / Black", "razon": "por qué refleja la personalidad" },
    "cuerpo": { "nombre": "Nombre fuente", "peso": "Regular / Medium", "razon": "por qué complementa al titular" },
    "alternativa_gratuita": "fuente gratuita en Google Fonts como alternativa"
  },
  "voz": {
    "tono_descripcion": "cómo suena la marca al hablar — en 1 línea descriptiva",
    "hacer": ["ejemplo concreto SÍ 1", "ejemplo concreto SÍ 2", "ejemplo concreto SÍ 3"],
    "evitar": ["ejemplo concreto NO 1", "ejemplo concreto NO 2", "ejemplo concreto NO 3"],
    "ejemplo_post_si": "ejemplo real de un post en el tono correcto para esta marca",
    "ejemplo_post_no": "mismo tema pero en el tono incorrecto"
  },
  "pilares": [
    { "nombre": "nombre del pilar", "descripcion": "qué abarca en 1 línea", "temas": ["tema1", "tema2", "tema3"] },
    { "nombre": "nombre del pilar", "descripcion": "qué abarca en 1 línea", "temas": ["tema1", "tema2", "tema3"] },
    { "nombre": "nombre del pilar", "descripcion": "qué abarca en 1 línea", "temas": ["tema1", "tema2", "tema3"] }
  ],
  "taglines": ["opción 1 memorable y específica", "opción 2 diferente enfoque", "opción 3 más emocional"],
  "bios": {
    "instagram": "bio completa para Instagram (máx 150 chars, con emojis con criterio)",
    "linkedin": "bio profesional para LinkedIn (máx 220 chars, sin emojis)",
    "tiktok": "bio para TikTok (máx 80 chars, tono informal)"
  },
  "restricciones": ["cosa que NUNCA debe hacer esta marca 1", "restricción 2", "restricción 3", "restricción 4"]
}

Los pilares deben ser exactamente 3. Los colores exactamente 3.`;

  let lastError = '';
  for (const model of MODELOS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0.72, max_tokens: 3500,
          messages: [
            { role: 'system', content: sistemaPrompt },
            { role: 'user',   content: prompt },
          ],
        }),
      });
      if (!resp.ok) { lastError = await resp.text(); console.error(`[contenido/manual-marca] ${model} HTTP error:`, lastError.slice(0, 200)); continue; }
      const data = await resp.json() as any;
      const tokens = data.usage?.total_tokens || 0;
      const contenido = data.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { lastError = `Sin JSON de ${model}`; continue; }
      console.log(`[contenido/manual-marca] OK | modelo: ${model} | marca: ${nombre} | tokens: ${tokens}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[contenido/manual-marca] excepción con ${model}:`, err.message);
    }
  }
  return res.status(502).json({ error: 'No se pudo generar el manual de marca', detalle: lastError });
});

// ── POST /api/contenido/imagen ──
contenidoRouter.post('/imagen', async (req: Request, res: Response) => {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'FAL_API_KEY no configurada en Railway' });

  const { prompt, formato = 'horizontal' } = req.body;
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Falta el prompt de imagen' });

  const imageSize = FAL_SIZES[formato] || 'landscape_4_3';

  try {
    const resp = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${apiKey}` },
      body: JSON.stringify({
        prompt: prompt.slice(0, 2000), image_size: imageSize,
        num_inference_steps: 4, num_images: 1, enable_safety_checker: true,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[contenido/imagen] fal.ai error:', resp.status, errText.slice(0, 200));
      return res.status(502).json({ error: 'Error en fal.ai', detalle: errText.slice(0, 200) });
    }

    const data = await resp.json() as any;
    const img = data.images?.[0];
    if (!img?.url) return res.status(502).json({ error: 'fal.ai no devolvió imagen' });

    console.log(`[contenido/imagen] OK ${imageSize}: ${img.url.slice(0, 60)}`);
    return res.json({ url: img.url, width: img.width, height: img.height });
  } catch (err: any) {
    console.error('[contenido/imagen] excepción:', err.message);
    return res.status(502).json({ error: 'Error al generar imagen', detalle: err.message });
  }
});
