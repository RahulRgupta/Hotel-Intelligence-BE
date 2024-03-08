const {Router}=require('express')
const hotelData =require('../controller/hotelDataofEachYear');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();

app.get('/hoteldatayear',jwtTokenVerify,hotelData)

module.exports =app;