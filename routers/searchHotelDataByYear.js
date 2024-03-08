const {Router}=require('express')
const hotelData =require('../controller/searchHotelDataByYear');
const app=Router();
app.get('/searchDataByYear',hotelData)
module.exports =app;