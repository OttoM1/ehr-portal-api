import type { CareTask, PortalHomeSummary } from '@ehr-portal/shared';
import './styles/style.scss';

type CheckResult = {
  id: string;
  method: string;
  path: string;
  status: number | null;
  ok: boolean;
  ms: number;
  body: string;
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <h1>portal validate</h1>
  <p class="sub">api + bff smoke checks against local gateway</p>
  <div class="bar">
    <div>
      <label for="base">base url</label>
      <input id="base" type="url" value="http://localhost:3001" spellcheck="false" />
    </div>
    <div>
      <label for="patient">x-patient-id</label>
      <input id="patient" type="text" value="pt-8842" spellcheck="false" />
    </div>
    <button type="button" id="run">run</button>
  </div>
  <div class="grid">
    <section>
      <h2>endpoints</h2>
      <table>
        <thead>
          <tr>
            <th>route</th>
            <th>st</th>
            <th>ms</th>
          </tr>
        </thead>
        <tbody id="checks"></tbody>
      </table>
      <p class="muted" id="summary" style="margin: 12px 0 0"></p>
    </section>
    <section>
      <h2>portal / home</h2>
      <div id="portal"><p class="muted">run checks to load home aggregate</p></div>
      <h2 style="margin-top: 16px">last response</h2>
      <pre class="mono" id="raw">—</pre>
    </section>
  </div>
`;

const baseInput = document.querySelector<HTMLInputElement>('#base')!;
const patientInput = document.querySelector<HTMLInputElement>('#patient')!;
const runBtn = document.querySelector<HTMLButtonElement>('#run')!;
const checksBody = document.querySelector<HTMLTableSectionElement>('#checks')!;
const summaryEl = document.querySelector<HTMLParagraphElement>('#summary')!;
const portalEl = document.querySelector<HTMLDivElement>('#portal')!;
const rawEl = document.querySelector<HTMLPreElement>('#raw')!;

function trimBase(url: string): string {
  return url.replace(/\/+$/, '');
}

async function request(
  base: string,
  patientId: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; text: string; ms: number }> {
  const started = performance.now();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'X-Patient-Id': patientId,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text, ms: Math.round(performance.now() - started) };
}

function renderChecks(results: CheckResult[]) {
  checksBody.innerHTML = results
    .map(
      (r) => `
    <tr class="${r.ok ? 'ok' : 'fail'}">
      <td class="mono">${r.method} ${r.path}</td>
      <td><span class="status-pill">${r.status ?? '—'}</span></td>
      <td>${r.ms}</td>
    </tr>`
    )
    .join('');

  const passed = results.filter((r) => r.ok).length;
  summaryEl.textContent = `${passed}/${results.length} passed`;
}

async function toggleTask(base: string, patientId: string, task: CareTask) {
  const res = await request(base, patientId, 'PATCH', `/api/v1/care-plan/tasks/${task.id}`, {
    done: task.done,
  });
  rawEl.textContent = res.text;
  const refresh = await request(base, patientId, 'GET', '/api/v1/portal/home');
  if (refresh.status === 200) {
    renderPortal(JSON.parse(refresh.text) as PortalHomeSummary);
  }
}

function renderPortal(home: PortalHomeSummary) {
  const base = trimBase(baseInput.value);
  const patientId = patientInput.value.trim();
  const vitals = home.vitals
    .map(
      (v) =>
        `<tr><td>${v.label}</td><td>${v.value} ${v.unit}</td><td>${v.status}</td></tr>`
    )
    .join('');

  const tasks = home.careTasks
    .map(
      (t) => `
      <div class="task-row">
        <input type="checkbox" data-task="${t.id}" ${t.done ? 'checked' : ''} />
        <span>${t.title}</span>
        <span class="muted">${t.due}</span>
      </div>`
    )
    .join('');

  portalEl.innerHTML = `
    <div class="portal-block">
      <h3>patient</h3>
      <table>
        <tr><th>name</th><td>${home.patient.preferredName}</td></tr>
        <tr><th>mrn</th><td>${home.patient.mrn}</td></tr>
        <tr><th>pcp</th><td>${home.patient.primaryCare}</td></tr>
        <tr><th>wellness</th><td>${home.wellnessScore}</td></tr>
      </table>
    </div>
    <div class="portal-block">
      <h3>vitals</h3>
      <table><thead><tr><th>label</th><th>value</th><th>status</th></tr></thead><tbody>${vitals}</tbody></table>
    </div>
    <div class="portal-block">
      <h3>tasks</h3>
      ${tasks || '<p class="muted">none</p>'}
    </div>
    <div class="portal-block">
      <h3>messages</h3>
      <p class="muted">${home.unreadMessageCount} unread</p>
    </div>
  `;

  portalEl.querySelectorAll<HTMLInputElement>('input[data-task]').forEach((el) => {
    el.addEventListener('change', () => {
      const id = el.dataset.task!;
      const task = home.careTasks.find((t) => t.id === id);
      if (task) void toggleTask(base, patientId, { ...task, done: el.checked });
    });
  });
}

async function runSuite() {
  runBtn.disabled = true;
  const base = trimBase(baseInput.value);
  const patientId = patientInput.value.trim();
  const results: CheckResult[] = [];
  let lastBody = '—';
  let home: PortalHomeSummary | null = null;

  const push = (
    id: string,
    method: string,
    path: string,
    status: number | null,
    ok: boolean,
    ms: number,
    body: string
  ) => {
    results.push({ id, method, path, status, ok, ms, body });
    renderChecks(results);
    if (body) {
      lastBody = body;
      rawEl.textContent = body.length > 4000 ? `${body.slice(0, 4000)}\n…` : body;
    }
  };

  try {
    const root = await request(base, patientId, 'GET', '/');
    push('root', 'GET', '/', root.status, root.status === 200, root.ms, root.text);

    const health = await request(base, patientId, 'GET', '/api/v1/health');
    push(
      'health',
      'GET',
      '/api/v1/health',
      health.status,
      health.status === 200,
      health.ms,
      health.text
    );

    const session = await request(base, patientId, 'GET', '/api/v1/session');
    push(
      'session',
      'GET',
      '/api/v1/session',
      session.status,
      session.status === 200,
      session.ms,
      session.text
    );

    const homeRes = await request(base, patientId, 'GET', '/api/v1/portal/home');
    const homeOk = homeRes.status === 200;
    push(
      'home',
      'GET',
      '/api/v1/portal/home',
      homeRes.status,
      homeOk,
      homeRes.ms,
      homeRes.text
    );
    if (homeOk) {
      home = JSON.parse(homeRes.text) as PortalHomeSummary;
    }

    const record = await request(base, patientId, 'GET', '/api/v1/clinical/health-record');
    push(
      'record',
      'GET',
      '/api/v1/clinical/health-record',
      record.status,
      record.status === 200,
      record.ms,
      record.text
    );

    const tasks = await request(base, patientId, 'GET', '/api/v1/care-plan/tasks');
    push(
      'tasks',
      'GET',
      '/api/v1/care-plan/tasks',
      tasks.status,
      tasks.status === 200,
      tasks.ms,
      tasks.text
    );

    if (tasks.status === 200) {
      const parsed = JSON.parse(tasks.text) as { tasks: CareTask[] };
      const target = parsed.tasks[0];
      if (target) {
        const patch = await request(base, patientId, 'PATCH', `/api/v1/care-plan/tasks/${target.id}`, {
          done: !target.done,
        });
        push(
          'patch-task',
          'PATCH',
          `/api/v1/care-plan/tasks/${target.id}`,
          patch.status,
          patch.status === 200,
          patch.ms,
          patch.text
        );
        const revert = await request(base, patientId, 'PATCH', `/api/v1/care-plan/tasks/${target.id}`, {
          done: target.done,
        });
        push(
          'patch-revert',
          'PATCH',
          `/api/v1/care-plan/tasks/${target.id}`,
          revert.status,
          revert.status === 200,
          revert.ms,
          revert.text
        );
      }
    }

    const messages = await request(base, patientId, 'GET', '/api/v1/messages');
    push(
      'messages',
      'GET',
      '/api/v1/messages',
      messages.status,
      messages.status === 200,
      messages.ms,
      messages.text
    );

    const badPatient = await request(base, 'unknown-id', 'GET', '/api/v1/health');
    push(
      'patient-403',
      'GET',
      '/api/v1/health (bad patient)',
      badPatient.status,
      badPatient.status === 403,
      badPatient.ms,
      badPatient.text
    );

    if (home) {
      renderPortal(home);
    } else {
      portalEl.innerHTML = '<p class="muted">home aggregate failed</p>';
    }

    rawEl.textContent = lastBody;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    push('error', '—', 'fetch', null, false, 0, message);
    portalEl.innerHTML = `<p class="muted">${message}</p>`;
  } finally {
    runBtn.disabled = false;
  }
}

runBtn.addEventListener('click', () => void runSuite());
