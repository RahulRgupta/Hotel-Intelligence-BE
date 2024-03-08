const {Router} = require('express');
const occupanyRoute = require('../controller/getOccupancy')
const app = Router();
 app.get('/getOccupancy',occupanyRoute)

 module.exports=app;