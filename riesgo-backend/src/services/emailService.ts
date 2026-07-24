const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL     = 'hola@creaia.co';

interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY no configurado — email omitido:', payload.subject);
    return;
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `CREA IA <${FROM_EMAIL}>`,
      to:      [payload.to],
      subject: payload.subject,
      html:    payload.html,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error('[email] Error Resend:', err);
  } else {
    console.log('[email] Enviado a', payload.to, '—', payload.subject);
  }
}

const NOMBRES_PLAN: Record<string, string> = {
  emprendedor: 'Plan Emprendedor',
  crecimiento: 'Plan Crecimiento',
  agencia:     'Plan Agencia',
  test:        'Plan de Prueba',
};

export async function enviarBienvenidaPago(email: string, plan: string, reference: string): Promise<void> {
  const nombrePlan = NOMBRES_PLAN[plan] || plan;
  await sendEmail({
    to:      email,
    subject: `¡Bienvenida a CREA IA! Tu ${nombrePlan} está activo 🎉`,
    html:    plantillaBienvenida(nombrePlan, email, reference),
  });
}

export async function enviarConfirmacionTrial(email: string): Promise<void> {
  await sendEmail({
    to:      email,
    subject: '¡Tu prueba gratuita de CREA IA está lista! 🚀',
    html:    plantillaTrial(email),
  });
}

function plantillaBienvenida(plan: string, email: string, ref: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenida a CREA IA</title></head>
<body style="margin:0;padding:0;background:#0D0A1E;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0A1E;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="https://creaia.co/contenido/logo-crea.png" alt="CREA IA" height="64"
               style="height:64px;mix-blend-mode:screen;">
        </td></tr>

        <!-- Card principal -->
        <tr><td style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
                        border-radius:20px;padding:40px 36px;">

          <!-- Icono check -->
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:72px;height:72px;border-radius:50%;
                        background:radial-gradient(circle,#6EE7B7,#10B981);
                        line-height:72px;font-size:34px;text-align:center;">✓</div>
          </div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;text-align:center;letter-spacing:-.5px;">
            ¡Tu ${plan} está activo!
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,.55);text-align:center;line-height:1.5;">
            Bienvenida a CREA IA — ya puedes empezar a crear contenido para tu marca.
          </p>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://creaia.co/contenido/estrategia.html"
               style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#6D28D9,#7C3AED,#8B5CF6);
                      color:#fff;font-size:16px;font-weight:800;border-radius:13px;text-decoration:none;">
              Entrar a CREA IA →
            </a>
          </div>

          <!-- Pasos -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="border-top:1px solid rgba(255,255,255,.1);padding-top:28px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);
                         text-transform:uppercase;letter-spacing:.6px;">Qué sigue</p>
              ${[
                ['🎨', 'Personaliza tu marca', 'Sube tu logo y elige los colores de tu negocio.'],
                ['⚡', 'Genera tu primer contenido', 'Ingresa el nombre de tu marca y genera publicaciones en 30 segundos.'],
                ['📅', 'Crea tu plan mensual', 'Obtén tu calendario de contenido para el mes completo.'],
              ].map(([icon, title, desc]) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;font-size:20px;">${icon}</td>
                  <td>
                    <div style="font-size:14px;font-weight:700;color:#fff;">${title}</div>
                    <div style="font-size:13px;color:rgba(255,255,255,.5);margin-top:2px;">${desc}</div>
                  </td>
                </tr>
              </table>`).join('')}
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.25);">
            ¿Tienes preguntas? Escríbenos a
            <a href="mailto:hola@creaia.co" style="color:rgba(167,139,250,.6);text-decoration:none;">hola@creaia.co</a>
            o al <a href="https://wa.me/573244793388" style="color:rgba(167,139,250,.6);text-decoration:none;">WhatsApp 324 479 3388</a>
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,.15);">
            Ref: ${ref}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function plantillaTrial(email: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu prueba gratuita está lista</title></head>
<body style="margin:0;padding:0;background:#0D0A1E;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0A1E;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td align="center" style="padding-bottom:28px;">
          <img src="https://creaia.co/contenido/logo-crea.png" alt="CREA IA" height="64"
               style="height:64px;mix-blend-mode:screen;">
        </td></tr>

        <tr><td style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
                        border-radius:20px;padding:40px 36px;">

          <div style="text-align:center;margin-bottom:24px;font-size:52px;">🚀</div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;text-align:center;letter-spacing:-.5px;">
            ¡Tu prueba de 7 días está lista!
          </h1>
          <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,.55);text-align:center;line-height:1.5;">
            Tienes acceso completo al <strong style="color:#A78BFA;">Plan Crecimiento</strong> durante 7 días.<br>
            Sin tarjeta de crédito. Sin sorpresas.
          </p>

          <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,.35);text-align:center;">
            Confirmaste tu cuenta con: <strong style="color:rgba(255,255,255,.5);">${email}</strong>
          </p>

          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://creaia.co/contenido/estrategia.html"
               style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#FF6B35,#FF8C42);
                      color:#fff;font-size:16px;font-weight:800;border-radius:13px;text-decoration:none;">
              Empezar ahora →
            </a>
          </div>

          <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;">
              💡 <strong style="color:#A78BFA;">Tip para empezar:</strong> Ve a «Generar contenido», escribe el nombre de tu marca
              y genera tu primera publicación en 30 segundos.
            </p>
          </div>

        </td></tr>

        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.25);">
            ¿Necesitas ayuda? Escríbenos a
            <a href="mailto:hola@creaia.co" style="color:rgba(167,139,250,.6);text-decoration:none;">hola@creaia.co</a>
            o al <a href="https://wa.me/573244793388" style="color:rgba(167,139,250,.6);text-decoration:none;">WhatsApp 324 479 3388</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
