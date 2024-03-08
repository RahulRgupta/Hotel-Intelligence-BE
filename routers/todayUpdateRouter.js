const {Router}=require('express')
const todayhotelData =require('../controller/todayUpdate');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();
app.get('/todayData',jwtTokenVerify,todayhotelData)
module.exports =app;