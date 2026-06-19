import { Request, Response, NextFunction } from 'express';

export function arlAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-arl-key');

  if (!process.env.ARL_KEY || key !== process.env.ARL_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  next();
}
