import { Hono } from 'hono';
import type { UpdateCareTaskBody } from '@ehr-portal/shared';
import { messagesByPatient, patients } from '../data/seed.js';
import { getCareTasks, updateCareTask } from '../store.js';
import { buildHomeSummary, fetchHealthRecord } from '../services/clinicalService.js';

export const v1 = new Hono();

v1.get('/health', (c) => {
  const { requestId, patientId } = c.get('portal');
  return c.json({
    status: 'ok',
    service: 'ehr-portal-gateway',
    requestId,
    patientId,
  });
});

v1.get('/session', (c) => {
  const { patientId, requestId } = c.get('portal');
  const patient = patients[patientId];
  return c.json({ requestId, patient });
});

v1.get('/portal/home', async (c) => {
  const { patientId } = c.get('portal');
  const summary = await buildHomeSummary(patientId);
  return c.json(summary);
});

v1.get('/clinical/health-record', async (c) => {
  const { patientId } = c.get('portal');
  const record = await fetchHealthRecord(patientId);
  return c.json(record);
});

v1.get('/care-plan/tasks', (c) => {
  const { patientId } = c.get('portal');
  return c.json({ tasks: getCareTasks(patientId) });
});

v1.patch('/care-plan/tasks/:taskId', async (c) => {
  const { patientId, requestId } = c.get('portal');
  const taskId = c.req.param('taskId');
  let body: UpdateCareTaskBody;
  try {
    body = await c.req.json<UpdateCareTaskBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST', requestId }, 400);
  }

  if (typeof body.done !== 'boolean') {
    return c.json({ error: 'done must be a boolean', code: 'VALIDATION_ERROR', requestId }, 422);
  }

  const updated = updateCareTask(patientId, taskId, body.done);
  if (!updated) {
    return c.json({ error: 'Task not found', code: 'NOT_FOUND', requestId }, 404);
  }

  return c.json({ task: updated });
});

v1.get('/messages', (c) => {
  const { patientId } = c.get('portal');
  const messages = messagesByPatient[patientId] ?? [];
  return c.json({
    messages,
    unreadCount: messages.filter((m) => m.unread).length,
  });
});
