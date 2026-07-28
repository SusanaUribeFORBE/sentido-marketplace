import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const wompiRouter = Router();

// Genera la firma de integridad requerida por Wompi Checkout
// Fórmula: SHA256(reference + amount_in_cents + currency + integrity_secret)
wompiRouter.post('/firmar', (req: Request, res: Response) => {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  const publicKey = process.env.WOMPI_PUBLIC_KEY;

  if (!secret || !publicKey) {
    return res.status(503).json({ error: 'Wompi no configurado en el servidor' });
  }

  const { reference, amount_in_cents, currency = 'COP' } = req.body as {
    reference?: string;
    amount_in_cents?: number;
    currency?: string;
  };

  if (!reference || !amount_in_cents) {
    return res.status(400).json({ error: 'Faltan reference o amount_in_cents' });
  }

  const cadena = `${reference}${amount_in_cents}${currency}${secret}`;
  const signature = crypto.createHash('sha256').update(cadena).digest('hex');

  return res.json({ signature, public_key: publicKey, reference, amount_in_cents, currency });
});
