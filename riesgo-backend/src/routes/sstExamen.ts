import { Router, Request, Response } from 'express';

export const sstExamenRouter = Router();

const PROMPT_SISTEMA = `
Eres un extractor de datos de exámenes médicos ocupacionales colombianos.
Recibirás el texto extraído de un PDF de examen médico ocupacional.
Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):

{
  "empleado": {
    "nombre": "",
    "cc": "",
    "fecha_nac": "YYYY-MM-DD o vacío",
    "sexo": "FEMENINO o MASCULINO o vacío",
    "celular": "",
    "eps": "",
    "arl": "",
    "fondo_pension": "",
    "estado_civil": "SOLTERO o CASADO o UNION LIBRE o DIVORCIADO o VIUDO o vacío",
    "escolaridad": "PRIMARIA o BACHILLER o TECNICO o UNIVERSITARIO o POSGRADO o vacío"
  },
  "empresa": {
    "nombre": "",
    "cargo": "",
    "departamento": ""
  },
  "examen": {
    "tipo": "PRE-INGRESO o PERIODICO o RETIRO o POST-INCAPACIDAD o CAMBIO DE OCUPACION o RETORNO LABORAL o SEGUIMIENTO",
    "fecha": "YYYY-MM-DD",
    "ips": "",
    "medico": "",
    "licencia_sst": "",
    "concepto_aptitud": "APTO SIN RESTRICCIONES o APTO CON RESTRICCIONES o NO APTO",
    "diagnostico_clinico": "ADULTO SANO o ADULTO CON PATOLOGIA o vacío",
    "examenes_realizados": ["lista de exámenes realizados"],
    "restricciones": ["lista de restricciones, vacío si no hay"],
    "restriccion_temporalidad": "TEMPORAL o PERMANENTE o vacío",
    "restriccion_hasta": "YYYY-MM-DD o vacío (solo si TEMPORAL)",
    "recomendaciones": ["lista de recomendaciones médicas, una por ítem"],
    "habitos": {
      "fumador": null,
      "consume_licor": null,
      "practica_deporte": null
    },
    "examenes_complementarios": {
      "audiometria": "normal o alterada o no realizada o vacío",
      "visiometria": "normal o alterada o no realizada o vacío",
      "espirometria": "normal o alterada o no realizada o vacío",
      "osteomuscular": "normal o alterado o no realizado o vacío"
    }
  }
}

Reglas:
- Si el texto dice "NO REFIERE" en ARL, ponlo exactamente así: "NO REFIERE"
- Fechas siempre en formato YYYY-MM-DD
- Si un campo no aparece en el texto, déjalo como cadena vacía "" o null para booleanos
- El concepto de aptitud debe ser exactamente una de las tres opciones dadas
- restriccion_temporalidad: extrae si el médico indica que las restricciones son temporales o permanentes. Si no hay restricciones, dejar vacío
- restriccion_hasta: fecha en que vence la restricción temporal (solo si temporalidad es TEMPORAL y el médico la menciona)
- Las recomendaciones son frases cortas, una por ítem del array
- habitos.fumador: true si fuma, false si niega tabaquismo, null si no hay información
- habitos.consume_licor: true si consume licor, false si niega, null si no hay información
- habitos.practica_deporte: true si practica deporte, false si niega actividad física, null si no hay información
- examenes_complementarios: usa "normal", "alterada"/"alterado", "no realizada"/"no realizado", o "" si no aparece
- Si el PDF es un resultado de laboratorio clínico (colesterol, triglicéridos, glucosa, hemograma, etc.) y no un examen médico ocupacional completo: extrae nombre y cédula del paciente, pon tipo="PERIODICO", ips con el nombre del laboratorio, examenes_realizados=["LABORATORIO"], y en recomendaciones incluye los hallazgos con valores alterados. Si todos los valores están normales, concepto_aptitud="APTO SIN RESTRICCIONES"; si alguno está por fuera del rango normal, concepto_aptitud="APTO CON RESTRICCIONES".
`.trim();

// ── Endpoint de visión: PDF escaneado → imágenes base64 → Groq vision ────────
sstExamenRouter.post('/analizar-examen-imagen', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  // Modelos en orden de preferencia; se intenta el siguiente si el anterior falla
  const VISION_MODELS = [
    'qwen/qwen3.6-27b', // modelo de visión activo en Groq (jul 2026)
  ];

  if (!apiKey) return res.status(503).json({ error: 'GROQ_API_KEY no configurada' });

  const { imagenes } = req.body as { imagenes?: string[] };
  if (!imagenes || !imagenes.length) {
    return res.status(400).json({ error: 'Se requiere al menos una imagen base64' });
  }

  // Estrategia de páginas: para exámenes de 3+ páginas la última suele tener el
  // qwen/qwen3.6-27b tiene límite de 8000 TPM (on_demand).
  // 3 imágenes a escala normal ≈ 10 229 tokens → excede el límite.
  // Máximo 2 páginas: primera (datos demográficos) + última (aptitud + firma médico).
  let paginasAEnviar: string[];
  if (imagenes.length <= 2) {
    paginasAEnviar = imagenes;
  } else {
    paginasAEnviar = [imagenes[0], imagenes[imagenes.length - 1]];
  }

  const content: object[] = [
    { type: 'text', text: `Analiza este examen médico ocupacional colombiano escaneado y extrae los datos.\n\n${PROMPT_SISTEMA}` },
    ...paginasAEnviar.map(b64 => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
  ];

  let lastError = '';
  for (const model of VISION_MODELS) {
    try {
      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, temperature: 0, max_tokens: 2000,
          messages: [{ role: 'user', content }] }),
      });

      if (!groqResp.ok) {
        lastError = await groqResp.text();
        console.error(`[sstExamen/imagen] ${model} error:`, lastError);
        continue; // intentar siguiente modelo
      }

      const groqData = await groqResp.json() as any;
      const contenido = groqData.choices?.[0]?.message?.content || '';
      const finishReason = groqData.choices?.[0]?.finish_reason || 'desconocido';
      console.log(`[sstExamen/imagen] ${model} finish_reason=${finishReason} content_len=${contenido.length}`);
      if (contenido.length > 0) console.log(`[sstExamen/imagen] contenido_inicio: ${contenido.slice(0, 300)}`);
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `Sin JSON (finish=${finishReason}): ${contenido.slice(0, 200)}`;
        console.error('[sstExamen/imagen]', lastError);
        continue;
      }

      console.log(`[sstExamen/imagen] OK con modelo ${model}, páginas: ${paginasAEnviar.length}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[sstExamen/imagen] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo extraer el examen con ningún modelo IA', detalle: lastError });
});

// ── Endpoint estándar: PDF con texto digital ──────────────────────────────────
sstExamenRouter.post('/analizar-examen', async (req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  const TEXT_MODELS = [
    process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    'groq/compound',
    'openai/gpt-oss-20b',
  ];

  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY no configurada en el servidor' });
  }

  const { texto } = req.body as { texto?: string };
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El campo "texto" es requerido y debe contener el texto del PDF' });
  }

  const textoLimitado = texto.slice(0, 6000);

  let lastError = '';
  for (const model of TEXT_MODELS) {
    try {
      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature: 0, max_tokens: 2000,
          messages: [
            { role: 'system', content: PROMPT_SISTEMA },
            { role: 'user',   content: `Texto del examen médico:\n\n${textoLimitado}` },
          ],
        }),
      });

      if (!groqResp.ok) {
        lastError = await groqResp.text();
        console.error(`[sstExamen/texto] ${model} error:`, lastError);
        continue;
      }

      const groqData = await groqResp.json() as any;
      const contenido = groqData.choices?.[0]?.message?.content || '';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = `JSON no encontrado en respuesta de ${model}`;
        console.error('[sstExamen/texto]', lastError, contenido.slice(0, 200));
        continue;
      }

      console.log(`[sstExamen/texto] OK con modelo ${model}`);
      return res.json(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      lastError = err.message;
      console.error(`[sstExamen/texto] excepción con ${model}:`, err.message);
    }
  }

  return res.status(502).json({ error: 'No se pudo analizar el examen', detalle: lastError });
});
