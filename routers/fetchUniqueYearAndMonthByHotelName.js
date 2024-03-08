const {Router}=require('express')
const uniqueYearAndMonth =require('../controller/fetchUniqueYearAndMonthByHotelName');
const app=Router();
app.get('/uniqueYearAndMonth',uniqueYearAndMonth)
module.exports =app;