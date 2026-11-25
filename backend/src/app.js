import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { readConfig } from './config/env.js';
import { clinicRoutes } from './routes/clinicRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';

export function createApp({ pool, config = readConfig(), logger = console, rateLimits = config.nodeEnv !== 'test', apiLimit = 120, writeLimit = 30 } = {}) {
  if (!pool) throw new Error('createApp requires a PostgreSQL pool.');
  const app = express();
  app.disable('x-powered-by'); app.set('trust proxy', config.nodeEnv === 'production' ? 1 : false);
  app.use(helmet());
  app.use((req, res, next) => { req.id = randomUUID(); res.setHeader('X-Request-Id', req.id); next(); });
  app.use(cors({ origin: (origin, callback) => { if (!origin || config.corsOrigins.includes(origin)) callback(null, true); else callback(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed to access the clinic service.')); }, credentials: false, methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
  if (rateLimits) {
    const limiterOptions = { windowMs: 60000, standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.' } }) };
    app.use('/api', rateLimit({ ...limiterOptions, limit: apiLimit, skip: (req) => req.path === '/health' }));
    app.use('/api', rateLimit({ ...limiterOptions, limit: writeLimit, skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) }));
  }
  app.use((req, _res, next) => { if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) return next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send request bodies as application/json.')); next(); });
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use('/api', clinicRoutes(pool));
  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'This endpoint could not be found.')));
  app.use(errorHandler(logger));
  return app;
}
