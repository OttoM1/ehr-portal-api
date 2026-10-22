import type { HealthRecordPayload, PortalHomeSummary, VitalTrend } from '@ehr-portal/shared';
import {
  appointmentsByPatient,
  labPanelByPatient,
  messagesByPatient,
  patients,
  timelineByPatient,
  vitalsByPatient,
  wellnessScoreByPatient,
} from '../data/seed.js';
import { getCareTasks } from '../store.js';

const UPSTREAM_LATENCY_MS = 35;

function simulateUpstream<T>(label: string, data: T): Promise<T> {
  void label;
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), UPSTREAM_LATENCY_MS);
  });
}

export async function fetchVitals(patientId: string): Promise<VitalTrend[]> {
  return simulateUpstream('vitals-service', vitalsByPatient[patientId] ?? []);
}

export async function fetchHealthRecord(patientId: string): Promise<HealthRecordPayload> {
  const [vitals, labPanel, timeline] = await Promise.all([
    simulateUpstream('vitals-service', vitalsByPatient[patientId] ?? []),
    simulateUpstream('lab-service', labPanelByPatient[patientId] ?? []),
    simulateUpstream('chart-service', timelineByPatient[patientId] ?? []),
  ]);
  return { vitals, labPanel, timeline };
}

/** Portal BFF: parallel fan-out to mock upstream clinical + engagement services. */
export async function buildHomeSummary(patientId: string): Promise<PortalHomeSummary> {
  const patient = patients[patientId];
  if (!patient) {
    throw new Error('patient missing');
  }

  const [vitals, timeline, appointments, messages, careTasks] = await Promise.all([
    fetchVitals(patientId),
    simulateUpstream('chart-service', timelineByPatient[patientId] ?? []),
    simulateUpstream('scheduling-service', appointmentsByPatient[patientId] ?? []),
    simulateUpstream('messaging-service', messagesByPatient[patientId] ?? []),
    Promise.resolve(getCareTasks(patientId)),
  ]);

  const unreadMessageCount = messages.filter((m) => m.unread).length;

  return {
    patient,
    vitals,
    wellnessScore: wellnessScoreByPatient[patientId] ?? 0,
    careTasks,
    timeline,
    appointments,
    messages,
    unreadMessageCount,
  };
}
