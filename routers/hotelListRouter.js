const {Router}=require('express')
const hotelData =require('../controller/hotelList');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();
app.get('/getHotelName',jwtTokenVerify,hotelData)
module.exports =app;
