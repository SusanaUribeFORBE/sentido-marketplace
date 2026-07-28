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

// ── Correo de confirmación post-compra ────────────────────────────────────────

interface CartItem {
  name: string;
  brand: string;
  price: number;
  qty: number;
  seals?: string;
  empCity?: string;
}

interface OrderPayload {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  cart: CartItem[];
  total: number;
  reference: string;
}

function sealImpact(sealStr: string): { ambiental: string[]; social: string[] } {
  const out = { ambiental: [] as string[], social: [] as string[] };
  const seals = (sealStr || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  for (const s of seals) {
    if (s.includes('jefatura'))                           out.social.push('Apoyas directamente a una mujer cabeza de hogar');
    else if (s.includes('liderazgo'))                    out.social.push('Impulso al liderazgo femenino en Colombia');
    else if (s.includes('orgánico') || s.includes('organico')) out.ambiental.push('Producción libre de agroquímicos y sintéticos');
    else if (s.includes('circular'))                     out.ambiental.push('Modelo de economía circular — cero residuos innecesarios');
    else if (s.includes('justo'))                        out.social.push('Precio justo directo al productor local');
    else if (s.includes('artesanal'))                    out.social.push('Oficio artesanal colombiano preservado y remunerado');
    else if (s.includes('adulto mayor'))                 out.social.push('Integración productiva y digna de adultos mayores');
    else if (s.includes('innovación') || s.includes('innovacion')) out.ambiental.push('Tecnología e innovación al servicio del planeta');
    else if (s.includes('rural'))                        out.social.push('Apoyo a comunidades rurales de Colombia');
    else if (s.includes('migrante'))                     out.social.push('Integración y oportunidad para comunidades migrantes');
  }
  out.ambiental = [...new Set(out.ambiental)];
  out.social    = [...new Set(out.social)];
  return out;
}

function buildConfirmationEmail(order: OrderPayload): string {
  const { name, cart, total, reference, city } = order;
  const fmt = (n: number) => '$ ' + Math.round(n).toLocaleString('es-CO');

  const allSeals = cart.map(i => i.seals || '').join(',');
  const impact   = sealImpact(allSeals);
  const brands   = [...new Set(cart.map(i => i.brand).filter(Boolean))];

  const productRows = cart.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #E0DAD0;font-size:13px;color:#1F1C17;">
        ${item.name}<br><span style="font-size:11px;color:#9C9488;">${item.brand}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #E0DAD0;text-align:center;font-size:13px;color:#5C554A;">${item.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E0DAD0;text-align:right;font-size:13px;font-weight:700;color:#1F1C17;">${item.price ? fmt(item.price * item.qty) : 'Cotizar'}</td>
    </tr>`).join('');

  const ambientalItems = impact.ambiental.length
    ? impact.ambiental.map(i => `<div style="background:#d1fae5;border-radius:8px;padding:9px 13px;margin-bottom:6px;font-size:13px;color:#065f46;">✓ ${i}</div>`).join('')
    : '';

  const socialItems = impact.social.length
    ? impact.social.map(i => `<div style="background:#dbeafe;border-radius:8px;padding:9px 13px;margin-bottom:6px;font-size:13px;color:#1e40af;">✓ ${i}</div>`).join('')
    : '';

  const impactSection = (ambientalItems || socialItems)
    ? `${ambientalItems ? `<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:#2D5A3D;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">🌱 Impacto Ambiental</div>${ambientalItems}</div>` : ''}
       ${socialItems ? `<div><div style="font-size:11px;font-weight:700;color:#2D5A3D;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">👩 Impacto Social</div>${socialItems}</div>` : ''}`
    : `<div style="background:#d1fae5;border-radius:8px;padding:9px 13px;font-size:13px;color:#065f46;">✓ Emprendimiento verificado con criterios SENTIDO — impacto social y ambiental comprobado</div>`;

  const quote = brands.length === 1
    ? `"Gracias por tu confianza. Tu compra no es solo una transacción — es el impulso que necesitamos para seguir construyendo con propósito."<br><br><strong style="color:#fff;">— Equipo ${brands[0]}</strong>`
    : `"Gracias por apoyar el emprendimiento sostenible en Colombia. Tu elección, hoy, marca la diferencia."<br><br><strong style="color:#fff;">— La comunidad SENTIDO</strong>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Tu compra SENTIDO — ${reference}</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- HEADER -->
  <tr><td style="background:#2D5A3D;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
    <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">🌿 SENTIDO</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;">Marketplace Consciente · sentidomarket.co</div>
  </td></tr>

  <!-- HERO -->
  <tr><td style="background:#ffffff;padding:36px 32px 24px;text-align:center;border-left:1px solid #E0DAD0;border-right:1px solid #E0DAD0;">
    <div style="font-size:42px;margin-bottom:14px;">🎉</div>
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#1F1C17;line-height:1.25;">¡Tu compra está cambiando<br>una vida real, ${name}!</h1>
    <p style="margin:0;font-size:14px;color:#5C554A;line-height:1.7;max-width:440px;margin:0 auto;">Tu decisión de hoy va mucho más allá de adquirir un producto. Elegiste decirle <strong>NO al greenwashing</strong> y respaldar una economía transparente, circular y justa en Colombia.</p>
    <div style="margin-top:14px;background:#FEF9EC;border:1px solid #F5D97A;border-radius:10px;padding:12px 16px;max-width:440px;margin:14px auto 0;text-align:left;">
      <span style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.05em;">¿Qué es el greenwashing?</span><br>
      <span style="font-size:12px;color:#78350F;line-height:1.6;">Es la práctica engañosa de marketing donde una empresa <em>afirma ser sostenible</em> sin serlo realmente — o donde sus acciones positivas son insignificantes frente al daño que causa. En SENTIDO, cada emprendimiento pasa por un filtro de verificación para que tu dinero genere un impacto real y auditado.</span>
    </div>
  </td></tr>

  <!-- IMPACT -->
  <tr><td style="background:#ffffff;padding:4px 32px 24px;border-left:1px solid #E0DAD0;border-right:1px solid #E0DAD0;">
    <div style="border:2px solid #2D5A3D;border-radius:14px;padding:22px;">
      <div style="font-size:12px;font-weight:800;color:#2D5A3D;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px;">🛡️ Impacto Verificado de tu Pedido</div>
      ${impactSection}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid #E0DAD0;font-size:12px;color:#5C554A;">✅ Aplicamos un filtro de verificación para asegurar el impacto real de cada emprendimiento.</div>
    </div>
  </td></tr>

  <!-- ORDER SUMMARY -->
  <tr><td style="background:#ffffff;padding:4px 32px 24px;border-left:1px solid #E0DAD0;border-right:1px solid #E0DAD0;">
    <div style="font-size:11px;font-weight:700;color:#9C9488;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">📦 Resumen de tu Pedido</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0DAD0;border-radius:12px;overflow:hidden;">
      <tr style="background:#F5F0E8;">
        <th style="padding:9px 14px;text-align:left;font-size:10px;color:#9C9488;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Producto</th>
        <th style="padding:9px 14px;text-align:center;font-size:10px;color:#9C9488;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Cant.</th>
        <th style="padding:9px 14px;text-align:right;font-size:10px;color:#9C9488;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Valor</th>
      </tr>
      ${productRows}
      <tr style="background:#F5F0E8;">
        <td colspan="2" style="padding:13px 14px;font-size:14px;font-weight:800;color:#1F1C17;">Total</td>
        <td style="padding:13px 14px;font-size:14px;font-weight:800;color:#2D5A3D;text-align:right;">${fmt(total)}</td>
      </tr>
    </table>
    <div style="margin-top:10px;font-size:11px;color:#9C9488;">
      Pedido: <strong style="color:#5C554A;">${reference}</strong>${city ? ` &nbsp;·&nbsp; Entrega en: <strong style="color:#5C554A;">${city}</strong>` : ''}
    </div>
  </td></tr>

  <!-- QUOTE -->
  <tr><td style="background:#2D5A3D;padding:28px 40px;border-left:1px solid #1F3D2B;border-right:1px solid #1F3D2B;">
    <div style="text-align:center;font-size:24px;margin-bottom:12px;">💚</div>
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.88);line-height:1.8;text-align:center;font-style:italic;">${quote}</p>
  </td></tr>

  <!-- NEXT STEPS -->
  <tr><td style="background:#ffffff;padding:28px 32px;border-left:1px solid #E0DAD0;border-right:1px solid #E0DAD0;">
    <div style="font-size:11px;font-weight:700;color:#9C9488;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">📲 ¿Qué sigue ahora?</div>
    <p style="margin:0 0 20px;font-size:14px;color:#5C554A;line-height:1.7;">Tu pedido ya está siendo preparado con empaques ecológicos y sostenibles. Te contactaremos pronto para coordinar la entrega a <strong>${city || 'tu dirección'}</strong>.</p>
    <div style="text-align:center;">
      <a href="https://sentidomarket.co/marketplace.html" style="display:inline-block;background:#2D5A3D;color:#ffffff;font-size:13px;font-weight:700;padding:13px 26px;border-radius:10px;text-decoration:none;margin:4px;">Seguir comprando</a>
      <a href="https://www.instagram.com/sentidomarket.co/" style="display:inline-block;background:#ffffff;color:#2D5A3D;font-size:13px;font-weight:700;padding:13px 26px;border-radius:10px;text-decoration:none;border:2px solid #2D5A3D;margin:4px;">Compartir impacto 📸</a>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#F5F0E8;padding:24px 32px;border-radius:0 0 16px 16px;text-align:center;border:1px solid #E0DAD0;border-top:none;">
    <div style="font-size:13px;font-weight:700;color:#2D5A3D;margin-bottom:6px;">🌿 SENTIDO Marketplace</div>
    <div style="font-size:11px;color:#9C9488;line-height:1.7;">
      sentidomarket.co &nbsp;·&nbsp; Comercio justo para un futuro sostenible<br>
      Este correo fue enviado a ${order.email} como confirmación de tu compra.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

wompiRouter.post('/confirmar-correo', async (req: Request, res: Response) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(503).json({ error: 'Servicio de correo no configurado' });

  const order = req.body as OrderPayload;
  if (!order.email || !order.reference) return res.status(400).json({ error: 'Faltan email o reference' });

  const html = buildConfirmationEmail(order);

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'SENTIDO Marketplace <onboarding@resend.dev>',
      to:      order.email,
      subject: `¡Tu pedido ${order.reference} está cambiando una vida real! 💚`,
      html,
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('[sentido-email] Error Resend:', err);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }

  console.log('[sentido-email] Confirmación enviada a', order.email, '—', order.reference);
  return res.json({ ok: true });
});
