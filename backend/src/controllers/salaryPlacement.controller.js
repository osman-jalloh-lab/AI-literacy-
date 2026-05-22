const salaryPlacementService = require('../services/salaryPlacement.service');
const { validateSearch } = require('../validators/salaryPlacement.validator');

function health(req, res) {
  res.json({ status: 'ok', service: 'salary-placement' });
}

function getPositions(req, res) {
  res.json({ positions: salaryPlacementService.getPositions() });
}

function searchPositions(req, res) {
  const query = validateSearch(req.query.query);
  res.json({
    query,
    results: salaryPlacementService.searchPositions(query)
  });
}

function getPayGrades(req, res) {
  res.json({ payGrades: salaryPlacementService.getPayGrades() });
}

function calculate(req, res) {
  const result = salaryPlacementService.calculatePlacement(req.body);
  res.status(result.decision === 'ESCALATE' ? 200 : 200).json(result);
}

function audit(req, res) {
  res.json(salaryPlacementService.auditPlacement(req.body));
}

function referenceTables(req, res) {
  res.json(salaryPlacementService.getReferenceTables());
}

module.exports = {
  health,
  getPositions,
  searchPositions,
  getPayGrades,
  calculate,
  audit,
  referenceTables
};
