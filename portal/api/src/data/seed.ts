import type {
  Appointment,
  CareTask,
  LabResult,
  Message,
  Patient,
  TimelineEvent,
  VitalTrend,
} from '@ehr-portal/shared';

export const patients: Record<string, Patient> = {
  'pt-8842': {
    id: 'pt-8842',
    name: 'Jordan Chen',
    preferredName: 'Jordan',
    age: 34,
    pronouns: 'they/them',
    mrn: 'MRN-2026-8842',
    primaryCare: 'Dr. Amara Okonkwo',
    avatarInitials: 'JC',
  },
};

export const vitalsByPatient: Record<string, VitalTrend[]> = {
  'pt-8842': [
    {
      id: 'hr',
      label: 'Heart rate',
      value: 72,
      unit: 'bpm',
      status: 'normal',
      history: [68, 70, 74, 71, 69, 72, 75, 72],
      reference: '60–100 bpm',
    },
    {
      id: 'bp',
      label: 'Blood pressure',
      value: 118,
      unit: 'sys',
      status: 'normal',
      history: [122, 119, 117, 120, 118, 116, 118, 118],
      reference: '<120/80 mmHg',
    },
    {
      id: 'spo2',
      label: 'SpO₂',
      value: 98,
      unit: '%',
      status: 'normal',
      history: [97, 98, 98, 99, 98, 97, 98, 98],
      reference: '≥95%',
    },
    {
      id: 'weight',
      label: 'Weight',
      value: 72.4,
      unit: 'kg',
      status: 'normal',
      history: [73.1, 72.9, 72.7, 72.6, 72.5, 72.4, 72.4, 72.4],
      reference: 'BMI 22.1',
    },
  ],
};

export const initialCareTasks: CareTask[] = [
  { id: 't1', title: 'Take morning lisinopril 10mg', due: 'Today, 8:00 AM', category: 'medication', done: true },
  { id: 't2', title: '30-minute walk (Zone 2)', due: 'Today, 6:00 PM', category: 'activity', done: false },
  { id: 't3', title: 'Fasting lipid panel — lab draw', due: 'Fri, Oct 24', category: 'lab', done: false },
  { id: 't4', title: 'Annual wellness video visit', due: 'Mon, Nov 3 · 2:30 PM', category: 'visit', done: false },
];

export const timelineByPatient: Record<string, TimelineEvent[]> = {
  'pt-8842': [
    {
      id: 'e1',
      date: 'Oct 18, 2026',
      title: 'HbA1c result posted',
      detail: '5.4% — within target range',
      kind: 'lab',
    },
    {
      id: 'e2',
      date: 'Oct 12, 2026',
      title: 'Telehealth follow-up',
      detail: 'Hypertension management — plan unchanged',
      kind: 'visit',
    },
    {
      id: 'e3',
      date: 'Oct 1, 2026',
      title: 'Prescription renewed',
      detail: 'Lisinopril 10mg — 90-day supply',
      kind: 'med',
    },
    {
      id: 'e4',
      date: 'Sep 22, 2026',
      title: 'Care team note',
      detail: 'Sleep hygiene goals added to care plan',
      kind: 'note',
    },
  ],
};

export const labPanelByPatient: Record<string, LabResult[]> = {
  'pt-8842': [
    { id: 'l1', name: 'Total cholesterol', value: 178, unit: 'mg/dL', low: 125, high: 200 },
    { id: 'l2', name: 'LDL', value: 98, unit: 'mg/dL', low: 0, high: 100 },
    { id: 'l3', name: 'HDL', value: 58, unit: 'mg/dL', low: 40, high: 60 },
    { id: 'l4', name: 'Triglycerides', value: 112, unit: 'mg/dL', low: 0, high: 150 },
    { id: 'l5', name: 'Vitamin D', value: 28, unit: 'ng/mL', low: 30, high: 100, flag: 'low' },
  ],
};

export const messagesByPatient: Record<string, Message[]> = {
  'pt-8842': [
    {
      id: 'm1',
      from: 'Dr. Okonkwo',
      role: 'Primary care',
      preview:
        'Your latest labs look great overall. Let’s talk about Vitamin D at your next visit.',
      time: '2h ago',
      unread: true,
    },
    {
      id: 'm2',
      from: 'Riverview Lab',
      role: 'Laboratory',
      preview: 'Your lipid panel results are now available in Health Record.',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 'm3',
      from: 'Care Navigator',
      role: 'Support',
      preview: 'Reminder: complete your pre-visit questionnaire before Nov 3.',
      time: 'Mon',
      unread: false,
    },
  ],
};

export const appointmentsByPatient: Record<string, Appointment[]> = {
  'pt-8842': [
    {
      id: 'a1',
      title: 'Annual wellness (video)',
      when: 'Mon, Nov 3 · 2:30 PM',
      provider: 'Dr. Amara Okonkwo',
      location: 'Video visit',
    },
    {
      id: 'a2',
      title: 'Lab draw — fasting lipids',
      when: 'Fri, Oct 24 · 7:45 AM',
      provider: 'Riverview Outpatient Lab',
      location: '1200 Harbor Blvd, Suite 2',
    },
  ],
};

export const wellnessScoreByPatient: Record<string, number> = {
  'pt-8842': 86,
};
