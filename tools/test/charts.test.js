import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arcPath, polarToCartesian, donut, lineChart, targetBar } from '../../assets/js/charts.js';

test('polarToCartesian puts 0 fraction at 12 o\'clock', () => {
  const p = polarToCartesian(100, 100, 50, 0);
  assert.equal(Math.round(p.x), 100);
  assert.equal(Math.round(p.y), 50);
});

test('polarToCartesian puts 0.25 fraction at 3 o\'clock', () => {
  const p = polarToCartesian(100, 100, 50, 0.25);
  assert.equal(Math.round(p.x), 150);
  assert.equal(Math.round(p.y), 100);
});

test('arcPath uses the small-arc flag below half a turn', () => {
  const d = arcPath(100, 100, 50, 0, 0.25);
  assert.match(d, /A 50 50 0 0 1/);
});

test('arcPath uses the large-arc flag above half a turn', () => {
  const d = arcPath(100, 100, 50, 0, 0.75);
  assert.match(d, /A 50 50 0 1 1/);
});

test('arcPath of a full turn stops just short so the ring closes cleanly', () => {
  const d = arcPath(100, 100, 50, 0, 1);
  assert.ok(!d.includes('NaN'));
  assert.match(d, /^M /);
});

test('donut renders one arc per slice with the right colours', () => {
  const svg = donut([
    { label: 'Reported', value: 90, color: '#006633' },
    { label: 'Clicked',  value: 10, color: '#E81838' }
  ]);
  assert.equal((svg.match(/<path/g) || []).length, 2);
  assert.ok(svg.includes('#006633'));
  assert.ok(svg.includes('#E81838'));
});

test('donut shows the centre figure', () => {
  const svg = donut([{ label: 'a', value: 1, color: '#000' }], { centre: '4%' });
  assert.ok(svg.includes('4%'));
});

test('donut survives an all-zero dataset instead of dividing by zero', () => {
  const svg = donut([{ label: 'a', value: 0, color: '#000' }]);
  assert.ok(!svg.includes('NaN'));
});

test('lineChart plots one point per value and scales to the highest', () => {
  const svg = lineChart([{ label: 'Jan', value: 10 }, { label: 'Feb', value: 20 }]);
  assert.equal((svg.match(/<circle/g) || []).length, 2);
  assert.ok(!svg.includes('NaN'));
});

test('lineChart with a single month still renders', () => {
  const svg = lineChart([{ label: 'Jul', value: 4 }]);
  assert.ok(!svg.includes('NaN'));
  assert.equal((svg.match(/<circle/g) || []).length, 1);
});

test('lineChart with all-equal values does not divide by a zero range', () => {
  const svg = lineChart([{ label: 'a', value: 5 }, { label: 'b', value: 5 }]);
  assert.ok(!svg.includes('NaN'));
});

test('targetBar caps the fill at 100 percent when the target is beaten', () => {
  const svg = targetBar({ label: 'Policies approved', actual: 12, target: 8 });
  assert.match(svg, /width="100%"/);
  assert.ok(svg.includes('12 of 8'));
});

test('targetBar floors the fill at 0 so a negative never renders as a full bar', () => {
  // A negative percentage is invalid CSS. The browser drops the declaration and
  // falls back to width:auto, which paints a FULL bar — the opposite of the truth.
  const svg = targetBar({ label: 'Budget variance', actual: -4, target: 8 });
  assert.match(svg, /width="0%"/);
  assert.ok(!svg.includes('-50%'));
  assert.ok(svg.includes('-4 of 8'));
});

test('targetBar with a zero target does not divide by zero', () => {
  const svg = targetBar({ label: 'Breaches', actual: 0, target: 0 });
  assert.ok(!svg.includes('NaN'));
});
