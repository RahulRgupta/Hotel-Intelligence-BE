const {Router} = require('express');
const addHotelCodeData = require('../controller/addhotelCode')
const app = Router();
 app.patch('/addHotelCode',addHotelCodeData)

 module.exports=app;