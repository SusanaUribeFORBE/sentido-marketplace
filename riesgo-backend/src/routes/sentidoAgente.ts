import { Router } from 'express';

export const sentidoAgenteRouter = Router();

interface ProductoSentido {
  name: string;
  price: string;
}

interface SolicitudSentido {
  name: string;
  city: string;
  category: string;
  formal: string;
  tagline: string;
  impact: string;
  why_sentido?: string;
  seals: string;
  products: ProductoSentido[];
}

function buildPrompt(data: SolicitudSentido): string {
  const products = (data.products || []).map((p) => `• ${p.name} — ${p.price}`).join('\n');
  return `Analiza esta solicitud de registro para SENTIDO, un marketplace colombiano de emprendimientos con impacto social y ambiental verificado.

CRITERIOS POR SELLO:
• Bienestar Consciente: productos de salud física/mental libres de químicos nocivos, testeados éticamente
• Liderazgo que Inspira: liderado por mujeres o comunidad LGBTI+, promueve equidad de género
• Jefatura de Hogar: equipo principalmente de madres/padres cabeza de familia, único sustento del hogar
• Sello Economía Circular / Segunda Vida: extiende ciclo de vida de materiales, segunda vida, residuo cero
• Producción Limpia & Eco-Friendly: recursos naturales, tecnologías verdes, no contamina agua ni tierra
• Cero Plástico / Empaque Ecológico: empaques 100% reutilizables, reciclables o compostables
• Origen Rural: opera en zona rural o trabaja con comunidades campesinas fuera de centros urbanos
• Inclusión Económica & Empleo Digno: emplea poblaciones vulnerables, excombatientes, víctimas del conflicto
• Saberes Ancestrales & Artesanal: preserva técnicas tradicionales (crochet, tejidos, artesanías del territorio)
• Comercio Justo Local: precios justos a productores locales, elimina explotación de intermediarios
• Innovación Sostenible & Biotech: biotecnología o tecnología para productos útiles de bajo impacto
• Origen Orgánico y Biocomercio: biodiversidad local, conservación y agricultura sostenible
• Adulto Mayor Activo: 30%+ del equipo o fundador/a tiene 60 años o más

SOLICITUD:
Nombre: ${data.name}
Ciudad: ${data.city}
Categoría: ${data.category}
Formalización: ${data.formal}
Descripción: ${data.tagline}
Impacto declarado: ${data.impact}
Motivación: ${data.why_sentido || '—'}
Sellos solicitados: ${(data.seals || '').replace(/;/g, ', ')}
Productos/servicios:
${products || '— No especificados'}

Responde SOLO con este JSON:
{
  "score": [0-100, basado en claridad y evidencia del impacto],
  "recommendation": "APROBAR" | "REVISAR" | "RECHAZAR",
  "verified_seals": ["sellos confirmados con evidencia clara del texto"],
  "pending_seals": ["sellos que necesitan más información o verificación"],
  "rejected_seals": ["sellos solicitados que NO se justifican en la información"],
  "justification": "2-3 oraciones explicando la decisión, en español",
  "admin_notes": "puntos específicos a verificar antes de aprobar, en español"
}`;
}

sentidoAgenteRouter.post('/verificar-postulacion', async (req, res) => {
  const data: SolicitudSentido = req.body?.data;

  if (!data || !data.name || !data.tagline) {
    return res.status(400).json({ error: 'Faltan datos de la solicitud' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not defined' });
  }

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          { role: 'system', content: 'Eres el agente revisor oficial de SENTIDO. Responde SOLO con JSON válido, sin texto adicional.' },
          { role: 'user', content: buildPrompt(data) },
        ],
      }),
    });

    if (!resp.ok) {
      const err: any = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${resp.status}`);
    }

    const result: any = await resp.json();
    const text = result.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('La IA no devolvió JSON válido');

    const ai = JSON.parse(jsonMatch[0]);
    return res.json(ai);
  } catch (err) {
    console.error('Error verificando postulación SENTIDO:', err);
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Error desconocido' });
  }
});
