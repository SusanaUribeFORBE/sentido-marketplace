import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { enviarBienvenidaPago, enviarConfirmacionTrial } from '../services/emailService';

const router = express.Router();

const WOMPI_PUB       = process.env.WOMPI_PUB_KEY || '';
const WOMPI_INTEGRITY = process.env.WOMPI_INTEGRITY_SECRET || '';
const WOMPI_EVENTS    = process.env.WOMPI_EVENTS_SECRET || '';
const SUPABASE_URL    = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || '';
const BASE_URL        = 'https://riesgo-backend-production.up.railway.app';

const PLANES: Record<string, { nombre: string; amount: number }> = {
  emprendedor: { nombre: 'Plan Emprendedor CREA IA', amount: 3900000  },
  crecimiento: { nombre: 'Plan Crecimiento CREA IA', amount: 8900000  },
  agencia:     { nombre: 'Plan Agencia CREA IA',     amount: 19900000 },
  test:        { nombre: 'Plan Test CREA IA',         amount: 200000   }, // $2.000 COP — solo para pruebas
};

function firmaIntegridad(reference: string, amountCents: number, currency: string): string {
  if (!WOMPI_INTEGRITY) return '';
  const chain = `${reference}${amountCents}${currency}${WOMPI_INTEGRITY}`;
  return crypto.createHash('sha256').update(chain).digest('hex');
}

// ── POST /api/crea/bienvenida-trial ── email de bienvenida al registrarse en trial
router.post('/bienvenida-trial', async (req: Request, res: Response) => {
  const email = (req.body.email as string || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Falta email' });
  try {
    await enviarConfirmacionTrial(email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[crea-planes] bienvenida-trial error:', err);
    return res.status(500).json({ error: 'Error enviando email' });
  }
});

// ── GET /api/crea/verificar-pago?reference=REF ──
// La página de éxito llama esto para confirmar el pago y actualizar el plan
router.get('/verificar-pago', async (req: Request, res: Response) => {
  const reference = (req.query.reference as string || '').trim();
  if (!reference) return res.status(400).json({ error: 'Falta reference' });

  const WOMPI_PRV = process.env.WOMPI_PRV_KEY || '';
  if (!WOMPI_PRV) return res.status(503).json({ error: 'Wompi no configurado' });

  try {
    const resp = await fetch(
      `https://production.wompi.co/v1/transactions?reference=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${WOMPI_PRV}` } }
    );
    const data = await resp.json() as any;
    const tx = data?.data?.[0];
    if (!tx) return res.json({ status: 'NOT_FOUND' });

    const aprobado = tx.status === 'APPROVED';

    // Si aprobado, actualizar plan en Supabase
    if (aprobado && SUPABASE_URL && SUPABASE_SECRET) {
      const partes = reference.split('-');
      if (partes.length >= 3) {
        const plan   = partes[1].toLowerCase();
        const userId = partes[2];
        if (userId !== 'guest') {
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type':  'application/json',
              'apikey':        SUPABASE_SECRET,
              'Authorization': `Bearer ${SUPABASE_SECRET}`,
            },
            body: JSON.stringify({
              user_metadata: {
                crea_plan:       plan,
                crea_plan_desde: new Date().toISOString(),
                crea_wompi_ref:  reference,
              },
            }),
          });
        }
      }
    }

    return res.json({ status: tx.status, plan: reference.split('-')[1]?.toLowerCase() });
  } catch (err) {
    console.error('[crea-planes] verificar-pago error:', err);
    return res.status(500).json({ error: 'Error verificando pago' });
  }
});

// ── GET /api/crea/firmar-pago?plan=crecimiento&user_id=UUID ──
// Devuelve firma + parámetros para el widget embebido de Wompi
router.get('/firmar-pago', (req: Request, res: Response) => {
  const plan   = ((req.query.plan as string) || '').toLowerCase();
  const userId = (req.query.user_id as string) || 'guest';
  const info   = PLANES[plan];
  if (!info) return res.status(400).json({ error: 'Plan inválido' });

  const reference = `CREA-${plan.toUpperCase()}-${userId}-${Date.now()}`;
  const currency  = 'COP';
  const signature = firmaIntegridad(reference, info.amount, currency);

  return res.json({
    publicKey:   WOMPI_PUB,
    reference,
    amountCents: info.amount,
    currency,
    signature,
    redirectUrl: `${BASE_URL}/contenido/pago-exitoso.html?plan=${plan}`,
    nombre:      info.nombre,
  });
});

// ── POST /api/crea/crear-link?plan=crecimiento&user_id=UUID ──
// Crea un link de pago en Wompi y devuelve la URL de redirección
router.post('/crear-link', async (req: Request, res: Response) => {
  const plan   = ((req.body.plan as string) || '').toLowerCase();
  const userId = (req.body.user_id as string) || 'guest';
  const info   = PLANES[plan];
  if (!info) return res.status(400).json({ error: 'Plan inválido' });

  const WOMPI_PRV = process.env.WOMPI_PRV_KEY || '';
  if (!WOMPI_PRV) return res.status(503).json({ error: 'Wompi no configurado' });

  const reference  = `CREA-${plan.toUpperCase()}-${userId}-${Date.now()}`;
  const redirectUrl = `${BASE_URL}/contenido/pago-exitoso.html?plan=${plan}&reference=${reference}`;

  try {
    const resp = await fetch('https://production.wompi.co/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${WOMPI_PRV}`,
      },
      body: JSON.stringify({
        name:              info.nombre,
        description:       `Suscripción mensual ${info.nombre}`,
        single_use:        true,
        collect_shipping:  false,
        currency:          'COP',
        amount_in_cents:   info.amount,
        redirect_url:      redirectUrl,
      }),
    });

    const data = await resp.json() as any;
    console.log(`[crea-planes] Wompi status:${resp.status} body:`, JSON.stringify(data));

    if (!resp.ok) {
      const msgs = data?.error?.messages
        ? Object.values(data.error.messages).flat().join(', ')
        : JSON.stringify(data?.error || data);
      return res.status(400).json({ error: msgs || 'Error creando link de pago' });
    }

    // Wompi devuelve el ID del link — URL: checkout.wompi.co/l/{id}
    const d = data?.data || data;
    const linkId = d?.id;
    const url = d?.permalink
      || d?.payment_link_url
      || d?.url
      || (linkId ? `https://checkout.wompi.co/l/${linkId}` : null);

    if (!url) {
      console.error('[crea-planes] Sin URL en respuesta Wompi:', JSON.stringify(data));
      return res.status(500).json({ error: 'No se pudo generar el link de pago. Intenta de nuevo.' });
    }

    console.log(`[crea-planes] Link creado | plan:${plan} | ref:${reference} | url:${url}`);
    return res.json({ url, reference });
  } catch (err) {
    console.error('[crea-planes] crear-link error:', err);
    return res.status(500).json({ error: 'Error de conexión con Wompi' });
  }
});

// Validar firma del webhook de Wompi
// Wompi firma: SHA256(event + sent_at + events_secret)
function validarFirmaWebhook(body: any): boolean {
  if (!WOMPI_EVENTS) return true; // sin secreto configurado, dejar pasar
  const { checksum, event, sent_at } = body;
  if (!checksum) return false;
  const chain = `${event}${sent_at}${WOMPI_EVENTS}`;
  const esperado = crypto.createHash('sha256').update(chain).digest('hex');
  return esperado === checksum;
}

// ── GET /api/crea/wompi-evento — validación de endpoint por Wompi ──
router.get('/wompi-evento', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', servicio: 'CREA IA webhook activo' });
});

// ── POST /api/crea/wompi-evento — webhook de confirmación ──
// Registrar en Wompi dashboard: https://riesgo-backend-production.up.railway.app/api/crea/wompi-evento
router.post('/wompi-evento', async (req: Request, res: Response) => {
  const evento = req.body;

  if (!validarFirmaWebhook(evento)) {
    console.warn('[crea-planes] ⚠️  Webhook con firma inválida rechazado');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  try {
    if (evento.event === 'transaction.updated') {
      const tx = evento.data?.transaction;
      if (tx?.status === 'APPROVED') {
        const ref: string = tx.reference || '';
        const customerEmail: string = tx.customer_email || '';
        console.log(`[crea-planes] ✅ Pago aprobado | ref:${ref} | email:${customerEmail}`);

        // Referencia: CREA-{PLAN}-{USER_ID}-{TS}
        const partes = ref.split('-');
        if (partes.length >= 3 && SUPABASE_URL && SUPABASE_SECRET) {
          const plan   = partes[1].toLowerCase();
          const userId = partes[2];

          // Enviar email de bienvenida
          if (customerEmail) {
            enviarBienvenidaPago(customerEmail, plan, ref).catch(e =>
              console.error('[crea-planes] Error enviando email:', e)
            );
          }

          // Guardar plan en metadata del usuario de Supabase
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type':  'application/json',
              'apikey':        SUPABASE_SECRET,
              'Authorization': `Bearer ${SUPABASE_SECRET}`,
            },
            body: JSON.stringify({
              user_metadata: {
                crea_plan:       plan,
                crea_plan_desde: new Date().toISOString(),
                crea_wompi_ref:  ref,
              },
            }),
          });
          console.log(`[crea-planes] Usuario ${userId} → plan ${plan}`);
        }
      }
    }
  } catch (err) {
    console.error('[crea-planes] Error en webhook:', err);
  }
  res.sendStatus(200);
});

export { router as creaPlanesRouter };
