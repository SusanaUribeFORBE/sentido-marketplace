import { Request, Response, NextFunction } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || '';

export async function creaAuth(req: Request, res: Response, next: NextFunction) {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    // Sin config de Supabase: dejar pasar (modo desarrollo)
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión en CREA.' });
  }

  const token = authHeader.slice(7);

  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_SECRET,
      },
    });

    if (!resp.ok) {
      return res.status(401).json({ error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });
    }

    const user = await resp.json() as any;
    (req as any).creaUser = user;

    const meta  = user.user_metadata || {};
    const plan  = meta.crea_plan || 'trial';
    const hasta = meta.crea_trial_hasta as string | undefined;
    if (plan === 'trial' && hasta && new Date(hasta) < new Date()) {
      return res.status(402).json({ error: 'trial_expired', message: 'Tu prueba gratuita venció. Elige un plan para continuar.' });
    }

    next();
  } catch (err) {
    console.error('[creaAuth] error validando sesión:', err);
    return res.status(401).json({ error: 'Error de autenticación.' });
  }
}
