const express = require('express');
const path = require('path');
const salaryPlacementRoutes = require('./routes/salaryPlacement.routes');

const app = express();
const rootDir = path.resolve(__dirname, '..', '..');

app.use(express.json());
app.use('/api/salary-placement', salaryPlacementRoutes);
app.use(express.static(rootDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hr-ai-companion' });
});

module.exports = app;
