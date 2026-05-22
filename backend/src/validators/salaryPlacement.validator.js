const rules = require('../data/salary-placement/salaryPlacementRules');

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function validateSearch(query) {
  return normalizeString(query);
}

function validateCalculationInput(body = {}) {
  const input = {
    positionTitle: normalizeString(body.positionTitle),
    yearsOfExperience: parseOptionalNumber(body.yearsOfExperience),
    exceptionArea: normalizeString(body.exceptionArea) || 'No',
    oldMidpoint: parseOptionalNumber(body.oldMidpoint),
    notes: normalizeString(body.notes),
    proposedTitleApproved: Boolean(body.proposedTitleApproved),
    reqTextGenerated: body.reqTextGenerated !== false
  };

  const errors = [];
  if (!input.positionTitle) errors.push('Cannot process. Missing position title.');
  if (!rules.exceptionOptions.includes(input.exceptionArea)) {
    errors.push(`Invalid exception area. Use one of: ${rules.exceptionOptions.join(', ')}.`);
  }
  if (Number.isNaN(input.yearsOfExperience)) errors.push('Years of experience must be numeric.');
  if (Number.isNaN(input.oldMidpoint)) errors.push('Old midpoint must be numeric if provided.');
  if (input.yearsOfExperience !== undefined && input.yearsOfExperience < 0) {
    errors.push('Cannot calculate. Years of experience cannot be negative.');
  }

  return { input, errors };
}

module.exports = {
  validateSearch,
  validateCalculationInput
};
