const {Router}=require('express')
const hotelModeldata =require('../controller/uploadHotelRecordData');
const app=Router();
app.post('/uploadHotelData',hotelModeldata)
module.exports =app;