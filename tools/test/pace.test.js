import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pace } from '../lib/pace.js';

test('dead on pace is on-track', () => {
  // July = month 7 of 12. Expected 8 * 7/12 = 4.67. Actual 5.
  assert.equal(pace({ actual: 5, target: 8, month: 7 }).state, 'on-track');
});

test('well behind pace is flagged', () => {
  assert.equal(pace({ actual: 1, target: 8, month: 7 }).state, 'behind');
});

test('beating the target outright is ahead', () => {
  assert.equal(pace({ actual: 9, target: 8, month: 7 }).state, 'ahead');
});

test('a lower-is-better target inverts the comparison', () => {
  // Phish failure rate: target 1%, actual 0.4% is good.
  assert.equal(pace({ actual: 0.4, target: 1, month: 7, lowerIsBetter: true }).state, 'ahead');
  assert.equal(pace({ actual: 3.0, target: 1, month: 7, lowerIsBetter: true }).state, 'behind');
});

test('a zero target that is met stays on-track rather than dividing by zero', () => {
  const r = pace({ actual: 0, target: 0, month: 7, lowerIsBetter: true });
  assert.equal(r.state, 'on-track');
  assert.ok(Number.isFinite(r.expected));
});

test('reports the expected figure so it can be shown to the user', () => {
  assert.equal(Math.round(pace({ actual: 5, target: 8, month: 6 }).expected * 100) / 100, 4);
});

test('month is clamped to the 1-12 range', () => {
  assert.equal(pace({ actual: 8, target: 8, month: 99 }).expected, 8);
  assert.equal(pace({ actual: 0, target: 8, month: 0 }).expected, 8 / 12);
});
