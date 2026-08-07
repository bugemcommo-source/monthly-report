import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from '../lib/smoke.js';

test('the test runner works', () => {
  assert.equal(hello(), 'ok');
});
