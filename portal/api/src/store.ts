import type { CareTask } from '@ehr-portal/shared';
import { initialCareTasks } from './data/seed.js';

/** In-memory portal state (demo only). Care tasks are the only mutable resource. */
const careTasksByPatient = new Map<string, CareTask[]>();

export function getCareTasks(patientId: string): CareTask[] {
  if (!careTasksByPatient.has(patientId)) {
    careTasksByPatient.set(patientId, structuredClone(initialCareTasks));
  }
  return careTasksByPatient.get(patientId)!;
}

export function updateCareTask(patientId: string, taskId: string, done: boolean): CareTask | null {
  const tasks = getCareTasks(patientId);
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], done };
  return tasks[index];
}
