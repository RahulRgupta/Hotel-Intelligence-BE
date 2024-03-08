const {Router} = require('express');
const getFilter = require('../controller/getFilter')
const app = Router();
 app.get('/getFilter',getFilter)

 module.exports=app;