import 'dotenv/config';
import path from 'path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { gameRouter } from './routes/game';
import { adminRouter } from './routes/admin';
import { clienteRouter } from './routes/cliente';
import { arlRouter } from './routes/arl';
import { analyticsRouter } from './routes/analytics';
import { sentidoAgenteRouter } from './routes/sentidoAgente';
import { sstExamenRouter } from './routes/sstExamen';
import { vigiaRouter } from './routes/vigia';
import { contenidoRouter } from './routes/contenido';
import { adminAuth } from './middleware/adminAuth';
import { clientAuth } from './middleware/clientAuth';
import { arlAuth } from './middleware/arlAuth';
import { creaAuth } from './middleware/creaAuth';
import { creaPlanesRouter } from './routes/creaPlanes';
import { wompiRouter } from './routes/wompi';
import { fraudeRouter } from './routes/fraude';
import { axaOrdenesRouter } from './routes/axaOrdenes';

const app = express();
app.set('trust proxy', 1);
app.use((req, _res, next) => {
  // Aumentar límite de payload para endpoint de visión (imágenes base64)
  if (req.path.includes('analizar-examen-imagen')) {
    express.json({ limit: '12mb' })(req, _res, next);
  } else {
    express.json({ limit: '1mb' })(req, _res, next);
  }
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

const sentidoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

// Límite más alto para análisis de exámenes (Groq maneja su propio rate limit)
const examLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

// ── creaia.co → CREA IA (debe ir ANTES del static para interceptar la raíz) ──
app.use((req, res, next) => {
  const host = req.hostname || '';
  if (host === 'creaia.co' || host === 'www.creaia.co') {
    const p = req.path;
    if (p.startsWith('/contenido') || p.startsWith('/api') || p.startsWith('/assets')) {
      return next();
    }
    return res.redirect(302, '/contenido/planes.html');
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/api', (_req, res) => {
  res.json({ status: 'RiesGO! backend corriendo ✅' });
});

// ── Rutas cortas CREA IA ──
app.get('/crea',             (_req, res) => res.redirect(301, '/contenido/planes.html'));
app.get('/crea/emprendedor', (_req, res) => res.redirect(301, '/contenido/planes.html'));
app.get('/crea/pro',         (_req, res) => res.redirect(301, '/contenido/planes.html'));
app.get('/crea/agencia',     (_req, res) => res.redirect(301, '/contenido/planes.html'));
app.get('/crea/login',       (_req, res) => res.redirect(301, '/contenido/login.html'));
app.get('/crea/registro',    (_req, res) => res.redirect(301, '/contenido/registro.html'));
app.get('/crea/app',         (_req, res) => res.redirect(301, '/contenido/estrategia.html'));

app.use('/api/fraude', fraudeRouter);
app.use('/api/axa', axaOrdenesRouter);
app.use('/api/vigia', vigiaRouter);
app.use('/api/crea', creaPlanesRouter);
app.use('/api/contenido', creaAuth, contenidoRouter);
app.use('/api/sst', examLimiter, sstExamenRouter);
app.use('/api/sentido', sentidoLimiter, sentidoAgenteRouter);
app.use('/api/wompi', wompiRouter);
app.use('/api', pinLimiter, authRouter);
app.use('/api', gameRouter);
app.use('/api', analyticsRouter);
app.use('/api/admin', adminAuth, adminRouter);
app.use('/api/cliente', clientAuth, clienteRouter);
app.use('/api/arl', arlAuth, arlRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RiesGO! backend en http://localhost:${PORT}`);
});
