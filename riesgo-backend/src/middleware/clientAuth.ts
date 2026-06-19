import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';

export async function clientAuth(req: Request, res: Response, next: NextFunction) {
  const codigoAcceso = req.header('x-client-key');

  if (!codigoAcceso) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('id_empresa, nombre_constructora, nit, arl_nombre')
    .eq('codigo_acceso', codigoAcceso)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error verificando el código de acceso' });
  }

  if (!empresa) {
    return res.status(401).json({ error: 'Código de acceso inválido' });
  }

  res.locals.empresa = empresa;
  next();
}
