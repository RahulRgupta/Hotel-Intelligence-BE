const {Router}=require('express')
const hotelData =require('../controller/hotelData');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();
app.get('/hotel',hotelData)
module.exports =app;
