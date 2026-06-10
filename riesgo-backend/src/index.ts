import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { gameRouter } from './routes/game';

const app = express();
app.use(express.json());
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

app.get('/', (_req, res) => {
  res.json({ status: 'RiesGO! backend corriendo ✅' });
});

app.use('/api', pinLimiter, authRouter);
app.use('/api', gameRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RiesGO! backend en http://localhost:${PORT}`);
});
