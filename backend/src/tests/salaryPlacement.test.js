const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/salaryPlacement.service');

test('basic pass sample returns PASS', () => {
  const result = service.auditPlacement({
    positionTitle: 'Administrative Coordinator',
    yearsOfExperience: 4,
    exceptionArea: 'No',
    reqTextGenerated: true
  });

  assert.equal(result.decision, 'PASS');
  assert.equal(result.calculation.estimatedSalary, 60666.68);
  assert.match(result.reqText, /New Pay Grade: PG 6/);
});

test('missing YOE sample returns NEEDS REVIEW', () => {
  const result = service.auditPlacement({
    positionTitle: 'Administrative Coordinator',
    exceptionArea: 'No'
  });

  assert.equal(result.decision, 'NEEDS REVIEW');
  assert.match(result.messages[0], /Missing years of experience/);
});

test('exception area sample returns ESCALATE', () => {
  const result = service.auditPlacement({
    positionTitle: 'Student Affairs Specialist',
    yearsOfExperience: 3,
    exceptionArea: 'Student Affairs'
  });

  assert.equal(result.decision, 'ESCALATE');
  assert.match(result.messages[0], /exception/);
});

test('old midpoint higher than new midpoint returns ESCALATE', () => {
  const result = service.auditPlacement({
    positionTitle: 'Administrative Coordinator',
    yearsOfExperience: 3,
    exceptionArea: 'No',
    oldMidpoint: 90000
  });

  assert.equal(result.decision, 'ESCALATE');
  assert.match(result.messages[0], /lower than old midpoint/);
});

test('no match sample returns NEEDS REVIEW', () => {
  const result = service.auditPlacement({
    positionTitle: 'Made Up Role',
    yearsOfExperience: 3,
    exceptionArea: 'No'
  });

  assert.equal(result.decision, 'NEEDS REVIEW');
  assert.match(result.messages[0], /No exact position match/);
});

test('negative YOE cannot calculate', () => {
  const result = service.auditPlacement({
    positionTitle: 'Administrative Coordinator',
    yearsOfExperience: -1,
    exceptionArea: 'No'
  });

  assert.equal(result.decision, 'NEEDS REVIEW');
  assert.match(result.messages[0], /cannot be negative/i);
});
