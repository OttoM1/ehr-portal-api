import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

serve({ fetch: app.fetch, port }, () => {
  console.log(`Portal API gateway listening on http://localhost:${port}`);
});
