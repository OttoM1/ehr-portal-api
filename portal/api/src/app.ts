import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestContext } from './middleware/requestContext.js';
import { rateLimit } from './middleware/rateLimit.js';
import { v1 } from './routes/v1.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      allowHeaders: ['Content-Type', 'X-Patient-Id', 'X-Request-Id'],
      exposeHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    })
  );

  app.get('/', (c) =>
    c.json({
      name: 'ehr-portal API gateway',
      docs: 'See repository README for route map',
      version: 'v1',
    })
  );

  const gateway = new Hono();
  gateway.use('*', requestContext);
  gateway.use('*', rateLimit);
  gateway.route('/v1', v1);

  app.route('/api', gateway);

  return app;
}
