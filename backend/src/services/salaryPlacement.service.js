const positionMapping = require('../data/salary-placement/positionMapping');
const payGrades = require('../data/salary-placement/payGrades');
const rules = require('../data/salary-placement/salaryPlacementRules');
const { validateCalculationInput } = require('../validators/salaryPlacement.validator');

function money(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getPositions() {
  return positionMapping;
}

function getPayGrades() {
  return payGrades;
}

function searchPositions(query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return positionMapping
    .map((position) => {
      const title = normalize(position.positionTitle);
      const proposed = normalize(position.proposedTitle);
      const exact = title === normalizedQuery || proposed === normalizedQuery;
      const close =
        title.includes(normalizedQuery) ||
        normalizedQuery.includes(title) ||
        proposed.includes(normalizedQuery);

      return {
        ...position,
        matchType: exact ? 'exact' : close ? 'close' : 'none'
      };
    })
    .filter((position) => position.matchType !== 'none');
}

function findPosition(positionTitle) {
  const normalizedTitle = normalize(positionTitle);
  const exact = positionMapping.find((position) => {
    return (
      normalize(position.positionTitle) === normalizedTitle ||
      normalize(position.proposedTitle) === normalizedTitle
    );
  });

  if (exact) return { position: exact, matchType: 'exact' };

  const close = searchPositions(positionTitle)[0];
  if (close) return { position: close, matchType: 'close' };

  return { position: null, matchType: 'none' };
}

function findPayGrade(payGrade) {
  return payGrades.find((grade) => normalize(grade.payGrade) === normalize(payGrade)) || null;
}

function buildReqText(payGrade) {
  if (!payGrade) return '';
  return rules.reqTextTemplate
    .replace('{payGrade}', payGrade.payGrade)
    .replace('{rangeMinToMid}', payGrade.rangeMinToMid);
}

function calculatePlacement(body = {}) {
  const { input, errors } = validateCalculationInput(body);
  if (errors.length > 0) {
    return buildAuditResponse({
      input,
      errors,
      position: null,
      matchType: 'none',
      payGrade: null,
      calculation: null
    });
  }

  const { position, matchType } = findPosition(input.positionTitle);
  if (!position) {
    return buildAuditResponse({
      input,
      errors: ['Needs Review. No exact position match found.'],
      position: null,
      matchType,
      payGrade: null,
      calculation: null
    });
  }

  const payGrade = findPayGrade(position.revisedPayGrade);
  if (!payGrade) {
    return buildAuditResponse({
      input,
      errors: ['Cannot calculate. Missing pay grade reference data.'],
      position,
      matchType,
      payGrade: null,
      calculation: null
    });
  }

  if (input.yearsOfExperience === undefined) {
    return buildAuditResponse({
      input,
      errors: ['Needs Review. Missing years of experience.'],
      position,
      matchType,
      payGrade,
      calculation: null
    });
  }

  const yearsAboveOne = Math.max(input.yearsOfExperience - 1, 0);
  const uncappedSalary = payGrade.minimumSalary + yearsAboveOne * payGrade.incrementPerYOE;
  const capped = uncappedSalary > payGrade.midpointSalary;
  const estimatedSalary = Math.min(uncappedSalary, payGrade.midpointSalary);

  const calculation = {
    label: 'Estimated Placement Salary',
    formula: 'Minimum Salary + ((Years of Experience - 1) x Increment Per YOE)',
    yearsAboveOne,
    uncappedSalary,
    estimatedSalary,
    midpointCapApplied: capped,
    steps: [
      `${money(payGrade.minimumSalary)} minimum salary`,
      `${input.yearsOfExperience} YOE - 1 = ${yearsAboveOne} years above first year`,
      `${yearsAboveOne} x ${money(payGrade.incrementPerYOE)} = ${money(yearsAboveOne * payGrade.incrementPerYOE)}`,
      `${money(payGrade.minimumSalary)} + ${money(yearsAboveOne * payGrade.incrementPerYOE)} = ${money(uncappedSalary)}`,
      capped
        ? `Calculated amount exceeds midpoint ${money(payGrade.midpointSalary)}; cap at midpoint.`
        : `Calculated amount is within the min-to-mid range.`
    ]
  };

  return buildAuditResponse({
    input,
    errors,
    position,
    matchType,
    payGrade,
    calculation
  });
}

function auditPlacement(body = {}) {
  return calculatePlacement(body);
}

function buildAuditResponse({ input, errors, position, matchType, payGrade, calculation }) {
  const reqText = buildReqText(payGrade);
  const checks = buildChecks({ input, errors, position, matchType, payGrade, calculation, reqText });
  const decision = decide({ input, errors, position, matchType, payGrade, calculation, checks, reqText });
  const messages = buildMessages({ input, errors, matchType, payGrade, decision });

  return {
    decision,
    status: decision,
    messages,
    input,
    match: {
      type: matchType,
      exact: matchType === 'exact',
      position
    },
    payGrade,
    calculation,
    reqText,
    checks,
    reference: {
      exceptionAreas: rules.exceptionAreas,
      escalationTriggers: rules.escalationTriggers
    }
  };
}

function check(label, status, detail) {
  return { label, status, detail };
}

function buildChecks({ input, errors, position, matchType, payGrade, calculation, reqText }) {
  const hasOldMidpoint = input.oldMidpoint !== undefined && !Number.isNaN(input.oldMidpoint);
  const newMidpointLower = hasOldMidpoint && payGrade && payGrade.midpointSalary < input.oldMidpoint;
  const exceptionSelected = rules.exceptionAreas.includes(input.exceptionArea);

  return [
    check('Position title matched', matchType === 'exact' ? 'PASS' : matchType === 'close' ? 'NEEDS REVIEW' : 'FAIL', matchType),
    check('Revised pay grade found', position && position.revisedPayGrade ? 'PASS' : 'FAIL', position?.revisedPayGrade || 'Missing'),
    check('Pay grade table matched', payGrade ? 'PASS' : 'FAIL', payGrade?.payGrade || 'Missing'),
    check('Min-to-mid range found', payGrade?.rangeMinToMid ? 'PASS' : 'FAIL', payGrade?.rangeMinToMid || 'Missing'),
    check('Years of experience entered', input.yearsOfExperience === undefined ? 'NEEDS REVIEW' : 'PASS', input.yearsOfExperience ?? 'Missing'),
    check('Placement math completed', calculation ? 'PASS' : errors.length ? 'NEEDS REVIEW' : 'FAIL', calculation ? money(calculation.estimatedSalary) : 'Not calculated'),
    check('Midpoint cap checked', calculation ? 'PASS' : 'NEEDS REVIEW', calculation?.midpointCapApplied ? 'Cap applied' : 'No cap needed or not calculated'),
    check('Exception area checked', exceptionSelected ? 'ESCALATE' : input.exceptionArea === 'Unsure' ? 'NEEDS REVIEW' : 'PASS', input.exceptionArea || 'Missing'),
    check('Old midpoint comparison checked', newMidpointLower ? 'ESCALATE' : 'PASS', hasOldMidpoint ? money(input.oldMidpoint) : 'Not provided'),
    check('Req text generated', reqText ? 'PASS' : 'FAIL', reqText ? 'Generated' : 'Missing')
  ];
}

function decide({ input, errors, position, matchType, payGrade, calculation, checks, reqText }) {
  if (
    rules.exceptionAreas.includes(input.exceptionArea) ||
    checks.some((item) => item.status === 'ESCALATE') ||
    (input.oldMidpoint !== undefined && payGrade && payGrade.midpointSalary < input.oldMidpoint)
  ) {
    return 'ESCALATE';
  }

  if (
    errors.length ||
    !position ||
    matchType !== 'exact' ||
    !payGrade ||
    !calculation ||
    input.exceptionArea === 'Unsure' ||
    !reqText ||
    checks.some((item) => item.status === 'NEEDS REVIEW' || item.status === 'FAIL') ||
    (position?.proposedTitle && !input.proposedTitleApproved)
  ) {
    return 'NEEDS REVIEW';
  }

  return 'PASS';
}

function buildMessages({ input, errors, matchType, payGrade, decision }) {
  if (input.positionTitle === '') return ['Cannot process. Missing position title.'];
  if (input.yearsOfExperience !== undefined && input.yearsOfExperience < 0) {
    return ['Cannot calculate. Years of experience cannot be negative.'];
  }
  if (matchType === 'none') return ['Needs Review. No exact position match found.'];
  if (input.yearsOfExperience === undefined) return ['Needs Review. Missing years of experience.'];
  if (input.exceptionArea === 'Unsure') return ['Needs Review. Check the hiring manager chain up to the VC.'];
  if (rules.exceptionAreas.includes(input.exceptionArea)) {
    return ['Escalate. This area is an exception and should not be finalized automatically.'];
  }
  if (input.oldMidpoint !== undefined && payGrade && payGrade.midpointSalary < input.oldMidpoint) {
    return ['Escalate. New midpoint is lower than old midpoint.'];
  }
  if (errors.length) return errors;
  return [`${decision}. Salary placement QA completed.`];
}

function getReferenceTables() {
  return {
    positionMapping,
    payGrades,
    exceptionRules: {
      exceptionAreas: rules.exceptionAreas,
      exceptionOptions: rules.exceptionOptions
    },
    escalationRules: rules.escalationTriggers,
    qaChecklist: rules.qaChecklist
  };
}

module.exports = {
  getPositions,
  getPayGrades,
  searchPositions,
  calculatePlacement,
  auditPlacement,
  getReferenceTables,
  money
};
