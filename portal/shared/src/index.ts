export type Patient = {
  id: string;
  name: string;
  preferredName: string;
  age: number;
  pronouns: string;
  mrn: string;
  primaryCare: string;
  avatarInitials: string;
};

export type VitalTrend = {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'elevated' | 'low';
  history: number[];
  reference: string;
};

export type CareTask = {
  id: string;
  title: string;
  due: string;
  category: 'medication' | 'activity' | 'lab' | 'visit';
  done: boolean;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: 'lab' | 'visit' | 'med' | 'note';
};

export type LabResult = {
  id: string;
  name: string;
  value: number;
  unit: string;
  low: number;
  high: number;
  flag?: 'high' | 'low';
};

export type Message = {
  id: string;
  from: string;
  role: string;
  preview: string;
  time: string;
  unread: boolean;
};

export type Appointment = {
  id: string;
  title: string;
  when: string;
  provider: string;
  location: string;
};

export type PortalNavItem = {
  path: string;
  label: string;
  icon: 'home' | 'record' | 'plan' | 'messages';
};

/** BFF aggregate for the home route — one round trip from the browser. */
export type PortalHomeSummary = {
  patient: Patient;
  vitals: VitalTrend[];
  wellnessScore: number;
  careTasks: CareTask[];
  timeline: TimelineEvent[];
  appointments: Appointment[];
  messages: Message[];
  unreadMessageCount: number;
};

export type ApiErrorBody = {
  error: string;
  code: string;
  requestId: string;
};

export type HealthRecordPayload = {
  vitals: VitalTrend[];
  labPanel: LabResult[];
  timeline: TimelineEvent[];
};

export type UpdateCareTaskBody = {
  done: boolean;
};
