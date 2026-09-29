import test from 'node:test';
import assert from 'node:assert/strict';
import { isOpenOpening, openingComputedStatus, deadlineLabel } from '../utils/openingStatus.js';

const DAY = 86400000;
const now = new Date('2026-10-01T12:00:00Z');
const in3days = new Date(now.getTime() + 3 * DAY);
const ago = new Date(now.getTime() - 3 * DAY);
const base = { status: 'OPEN', positionsAvailable: 2, positionsFilled: 0 };

test('open when seats remain and no deadline', () => {
  assert.equal(isOpenOpening({ ...base }, now), true);
});

test('explicit CLOSED status wins over everything else', () => {
  assert.equal(isOpenOpening({ ...base, status: 'CLOSED' }, now), false);
  assert.equal(openingComputedStatus({ ...base, status: 'CLOSED', positionsAvailable: 5 }, now), 'CLOSED');
});

test('fully filled opening is closed even with OPEN status', () => {
  assert.equal(isOpenOpening({ ...base, positionsFilled: 2 }, now), false);
  assert.equal(isOpenOpening({ ...base, positionsFilled: 3, positionsAvailable: 2 }, now), false);
  assert.equal(isOpenOpening({ ...base, positionsFilled: 1 }, now), true);
});

test('past deadline closes an opening even with seats remaining', () => {
  assert.equal(isOpenOpening({ ...base, deadline: ago }, now), false);
  assert.equal(openingComputedStatus({ ...base, deadline: ago }, now), 'CLOSED');
});

test('future deadline stays open; deadline today (>= now) stays open', () => {
  assert.equal(isOpenOpening({ ...base, deadline: in3days }, now), true);
  assert.equal(isOpenOpening({ ...base, deadline: now }, now), true);
});

test('closed rule wins even when only one condition trips', () => {
  assert.equal(isOpenOpening({ ...base, status: 'CLOSED', deadline: in3days }, now), false);
  assert.equal(isOpenOpening({ status: 'OPEN', positionsAvailable: 1, positionsFilled: 0, deadline: ago }, now), false);
});

test('computed status agrees with isOpenOpening', () => {
  assert.equal(openingComputedStatus({ ...base, deadline: in3days }, now), 'OPEN');
  assert.equal(openingComputedStatus(null, now), 'CLOSED');
  assert.equal(openingComputedStatus({}, now), 'OPEN');
});

test('deadline labels: relative near, absolute far, passed', () => {
  assert.equal(deadlineLabel({ deadline: in3days }, now), 'Closes in 3 days');
  assert.equal(deadlineLabel({ deadline: new Date(now.getTime() + DAY) }, now), 'Closes in 1 day');
  assert.equal(deadlineLabel({ deadline: new Date(now.getTime() + 30 * DAY) }, now), `Apply by ${new Date(now.getTime() + 30 * DAY).toLocaleDateString()}`);
  assert.equal(deadlineLabel({ deadline: ago }, now), 'Deadline passed');
  assert.equal(deadlineLabel({}, now), null);
});
