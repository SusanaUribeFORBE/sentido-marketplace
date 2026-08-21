import { Router, Request, Response } from 'express';

export const fraudeRouter = Router();

const SYSTEM_PROMPT = `
Eres un experto en ciberseguridad especializado en fraudes digitales en Colombia.
Analiza el mensaje o email proporcionado y determina si es fraudulento.

Señales que debes evaluar:
- Dominio del remitente no coincide con la entidad que dice ser (ej: bancolombia.xyz, dian-colombia.net, n.convertkit.com enviando en nombre de un banco)
- Tácticas de urgencia o amenaza: embargo, bloqueo de cuenta, sanción, cobro jurídico, vencimiento inmediato
- Solicitud de claves, datos personales, transferencias o acceso a portales
- URLs acortadas, dominios con errores tipográficos, dominios con palabras genéricas como "portal", "oficial", "colombia"
- Errores ortográficos, texto genérico sin nombre del destinatario, saludos vagos como "Estimado usuario"
- Promesas de reembolsos inesperados, premios, o ganancias fáciles
- Remitentes con dominios extranjeros (.de, .ru, .xyz) simulando ser colombianos

Entidades frecuentemente suplantadas en Colombia:
Bancolombia, Davivienda, BBVA, Nequi, Daviplata, Banco de Bogotá, Banco Popular, DIAN, Superintendencia Financiera, Ministerio de Transporte, ANSV, Secretaría Distrital, Rappi, Mercado Libre, PayU, Wompi, EPM, ETB, Claro, Movistar, Tigo, TransMilenio

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin texto adicional, sin explicaciones fuera del JSON):
{
  "es_fraude": true,
  "nivel_riesgo": "ALTO",
  "tipo_fraude": "Phishing bancario",
  "entidad_suplantada": "Bancolombia",
  "confianza": 95,
  "indicadores": ["El remitente usa dominio .de (alemán) simulando ser colombiano", "Asunto crea urgencia con 'embargo'"],
  "resumen": "Este mensaje es un intento de fraude. El remitente usa un dominio extranjero para suplantar a Bancolombia y presionarlo a ingresar a un portal falso donde robarán sus credenciales.",
  "recomendaciones": ["No haga clic en ningún enlace del mensaje", "Repórtelo al correo abusosbancolombia@bancolombia.com.co", "Elimine el mensaje y márquelo como spam"]
}

Los valores posibles son:
- es_fraude: true | false
- nivel_riesgo: "ALTO" | "MEDIO" | "BAJO"
- tipo_fraude: "Phishing bancario" | "Suplantación gubernamental" | "Estafa de reembolso" | "Amenaza de cobro falso" | "Oferta laboral falsa" | "Inversión fraudulenta" | "Suplantación de plataforma" | "Otro" | null
- entidad_suplantada: nombre de la entidad como string, o null
- confianza: número entero de 0 a 100
- indicadores: array de strings, máximo 6 señales específicas encontradas en el texto
- resumen: string de 2-3 oraciones en lenguaje claro para el usuario colombiano
- recomendaciones: array de strings, máximo 4 acciones concretas
`.trim();

fraudeRouter.post('/analizar', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Servicio no disponible' });

  const { texto, url } = req.body as { texto?: string; url?: string };
  if (!texto?.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es requerido' });
  }

  const contenido = url?.trim()
    ? `MENSAJE:\n${texto.trim()}\n\nURL O ENLACE INCLUIDO: ${url.trim()}`
    : `MENSAJE:\n${texto.trim()}`;

  const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
  let lastError = '';

  for (const model of MODELS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 800,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: contenido.slice(0, 5000) },
          ],
        }),
      });

      if (!resp.ok) { lastError = await resp.text(); continue; }

      const data = await resp.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) { lastError = `Sin JSON: ${content.slice(0, 200)}`; continue; }

      console.log(`[fraude] OK modelo=${model} confianza=${JSON.parse(match[0]).confianza}`);
      return res.json(JSON.parse(match[0]));
    } catch (err: any) {
      lastError = err.message;
    }
  }

  return res.status(502).json({ error: 'No se pudo analizar el mensaje', detalle: lastError });
});
