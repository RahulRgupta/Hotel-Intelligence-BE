const {Router}=require('express')
const hotelDataChart =require('../controller/chartData');
const app=Router();
app.get('/hoteldatachart',hotelDataChart)
module.exports =app;