import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';
import { patients } from '../data/seed.js';

export type PortalContext = {
  requestId: string;
  patientId: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    portal: PortalContext;
  }
}

const DEFAULT_PATIENT = 'pt-8842';

export async function requestContext(c: Context, next: Next) {
  const incoming = c.req.header('x-request-id');
  const requestId = incoming && incoming.length <= 64 ? incoming : randomUUID();

  const headerPatient = c.req.header('x-patient-id');
  const patientId = headerPatient ?? DEFAULT_PATIENT;

  if (!patients[patientId]) {
    return c.json(
      {
        error: 'Unknown patient context',
        code: 'PATIENT_NOT_FOUND',
        requestId,
      },
      403
    );
  }

  c.set('portal', { requestId, patientId });
  c.header('X-Request-Id', requestId);
  await next();
}
