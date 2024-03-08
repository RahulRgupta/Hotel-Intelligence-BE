const {Router} = require('express');
const getRevenue = require('../controller/getRevenue')
const app = Router();
 app.get('/getRevenue',getRevenue)

 module.exports=app;