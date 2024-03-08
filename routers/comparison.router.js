const { Router } = require('express')
const comparisonController = require('../controller/comparison');
const app = Router();
app.get('/comparison', comparisonController)
module.exports = app;