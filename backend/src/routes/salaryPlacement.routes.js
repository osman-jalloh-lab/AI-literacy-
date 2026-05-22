const express = require('express');
const controller = require('../controllers/salaryPlacement.controller');

const router = express.Router();

router.get('/health', controller.health);
router.get('/positions', controller.getPositions);
router.get('/positions/search', controller.searchPositions);
router.get('/pay-grades', controller.getPayGrades);
router.post('/calculate', controller.calculate);
router.post('/audit', controller.audit);
router.get('/reference-tables', controller.referenceTables);

module.exports = router;
