import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProject } from '../lib/tracking.js';

const SAMPLE = `# BLC School Management System
Status: In Progress · Progress: 78% · Target completion: Sept 2026
Linked to: Deliverable #3 (Digital Innovation), BSC "No. of Digitalization Utilized"

## Modules
- [x] Enrollment
- [x] Student Records
- [ ] Billing (60%)
- [ ] Parent Portal

## Blockers
- Waiting on the finance chart of accounts from Accounting (raised 15 Jul 2026)

## Monthly log
- 2026-07 — Grading module finished and turned over; billing started
- 2026-05 — Student records completed, presented to BLC
`;

test('reads the system name from the heading', () => {
  assert.equal(parseProject(SAMPLE).name, 'BLC School Management System');
});

test('reads status and progress from the summary line', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.status, 'In Progress');
  assert.equal(p.progress, 78);
  assert.equal(p.targetCompletion, 'Sept 2026');
});

test('counts finished and unfinished modules', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.modules.length, 4);
  assert.equal(p.modules.filter((m) => m.done).length, 2);
  assert.equal(p.modules[2].name, 'Billing');
  assert.equal(p.modules[2].percent, 60);
});

test('collects blockers', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.blockers.length, 1);
  assert.match(p.blockers[0], /chart of accounts/);
});

test('reads the monthly log newest first', () => {
  const p = parseProject(SAMPLE);
  assert.equal(p.log[0].month, '2026-07');
  assert.match(p.log[0].text, /Grading module finished/);
});

test('finds the entry for a specific month', () => {
  const p = parseProject(SAMPLE);
  assert.match(p.entryFor('2026-05'), /Student records completed/);
  assert.equal(p.entryFor('2026-06'), null);
});

test('an empty blockers section yields an empty list, not a crash', () => {
  const p = parseProject('# X\nStatus: Done · Progress: 100%\n\n## Blockers\n\n## Monthly log\n');
  assert.deepEqual(p.blockers, []);
  assert.equal(p.progress, 100);
});

test('a file saved by Notepad with CRLF endings keeps every log entry', () => {
  // The owner edits these in Notepad, which writes \r\n. This used to drop
  // every entry but the oldest, silently losing the current month.
  const p = parseProject(SAMPLE.replace(/\n/g, '\r\n'));
  assert.equal(p.log.length, 2);
  assert.equal(p.log[0].month, '2026-07');
  assert.match(p.entryFor('2026-07'), /Grading module finished/);
  assert.ok(!p.log[0].text.includes('\r'));
  assert.equal(p.modules.length, 4);
  assert.equal(p.blockers.length, 1);
  assert.equal(p.name, 'BLC School Management System');
  assert.equal(p.progress, 78);
});
