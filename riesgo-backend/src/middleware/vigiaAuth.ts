import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface VigiaSession {
  token: string;
  empresa_id: string | null;
  es_admin: boolean;
  expira_en: string;
}

declare global {
  namespace Express {
    interface Request {
      vigiaSession?: VigiaSession;
    }
  }
}

function getDB() {
  return createClient(
    process.env.VIGIA_SUPABASE_URL!,
    process.env.VIGIA_SUPABASE_SERVICE_KEY!
  );
}

export async function vigiaAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  const db = getDB();
  const { data, error } = await db
    .from('vigia_sesiones')
    .select('token, empresa_id, es_admin, expira_en')
    .eq('token', token)
    .gt('expira_en', new Date().toISOString())
    .single();

  if (error || !data) return res.status(401).json({ error: 'Sesión inválida o expirada' });

  req.vigiaSession = data as VigiaSession;
  next();
}

export function vigiaAdminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.vigiaSession?.es_admin) {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }
  next();
}
