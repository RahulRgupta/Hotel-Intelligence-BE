const {Router} = require('express');
const getComparison = require('../controller/getComparison')
const app = Router();
 app.get('/getComparisonss',getComparison)

 module.exports=app;