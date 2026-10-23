#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '../api');

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3001';
const patientId = 'pt-8842';

const checks = [
  { name: 'root', path: '/', expect: 200, patient: false },
  { name: 'health', path: '/api/v1/health', expect: 200, patient: true },
  { name: 'home', path: '/api/v1/portal/home', expect: 200, patient: true },
  { name: 'bad-patient', path: '/api/v1/health', expect: 403, patient: true, patientId: 'nope' },
];

async function hit(path, usePatient, overridePatient) {
  const headers = {};
  if (usePatient) headers['X-Patient-Id'] = overridePatient ?? patientId;
  const res = await fetch(`${base}${path}`, { headers });
  const text = await res.text();
  return { status: res.status, text };
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(`${base}/`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await delay(300);
  }
  throw new Error(`API did not become ready at ${base}`);
}

function startApi() {
  const child = spawn('node', ['dist/index.js'], {
    cwd: apiDir,
    env: { ...process.env, PORT: '3001' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (d) => process.stdout.write(d));
  child.stderr?.on('data', (d) => process.stderr.write(d));
  return child;
}

const api = startApi();
let failed = false;

try {
  await waitForServer();

  for (const check of checks) {
    const { status, text } = await hit(check.path, check.patient, check.patientId);
    if (status !== check.expect) {
      failed = true;
      console.error(`FAIL ${check.name}: expected ${check.expect}, got ${status}\n${text}`);
    } else {
      console.log(`ok ${check.name} (${status})`);
    }
  }

  const tasksRes = await hit('/api/v1/care-plan/tasks', true);
  if (tasksRes.status !== 200) {
    failed = true;
    console.error(`FAIL tasks list: ${tasksRes.status}`);
  } else {
    const { tasks } = JSON.parse(tasksRes.text);
    const task = tasks?.[0];
    if (!task) {
      failed = true;
      console.error('FAIL tasks list: no tasks in seed data');
    } else {
      const patch = await fetch(`${base}/api/v1/care-plan/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Patient-Id': patientId },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!patch.ok) {
        failed = true;
        console.error(`FAIL patch task: ${patch.status}`);
      } else {
        console.log('ok patch task');
        await fetch(`${base}/api/v1/care-plan/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Patient-Id': patientId },
          body: JSON.stringify({ done: task.done }),
        });
      }
    }
  }
} catch (err) {
  failed = true;
  console.error(err);
} finally {
  api.kill('SIGTERM');
}

if (failed) process.exit(1);
