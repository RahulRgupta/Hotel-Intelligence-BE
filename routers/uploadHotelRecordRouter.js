const {Router}=require('express')
const hotelRecord =require('../controller/uploaHotelRecord');
const app=Router();
app.post('/uploaHotelRecord',hotelRecord);
module.exports =app;