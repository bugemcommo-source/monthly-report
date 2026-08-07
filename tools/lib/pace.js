/**
 * Works out whether an annual target is keeping up with the calendar.
 *
 * `month` is 1..12. A target of 8 for the year is "on pace" in July if roughly
 * 8 * 7/12 have been achieved. A 10% tolerance stops trivial shortfalls being
 * reported as problems.
 */
const TOLERANCE = 0.10;

export function pace({ actual, target, month, lowerIsBetter = false }) {
  const m = Math.min(12, Math.max(1, Number(month) || 1));
  const expected = lowerIsBetter ? target : (target * m) / 12;

  let state;
  if (lowerIsBetter) {
    if (actual <= target * (1 - TOLERANCE) || (target === 0 && actual < 0)) state = 'ahead';
    else if (actual <= target) state = 'on-track';
    else state = 'behind';
    if (target === 0 && actual === 0) state = 'on-track';
  } else {
    if (actual >= target) state = 'ahead';
    else if (actual >= expected * (1 - TOLERANCE)) state = 'on-track';
    else state = 'behind';
  }

  return {
    state,
    expected,
    shortfall: lowerIsBetter ? Math.max(0, actual - target) : Math.max(0, expected - actual),
    percent: target > 0 ? Math.round((actual / target) * 100) : (actual === 0 ? 100 : 0)
  };
}
