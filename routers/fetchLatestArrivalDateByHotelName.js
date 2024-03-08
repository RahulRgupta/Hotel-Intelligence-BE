const {Router}=require('express')
const {jwtTokenVerify} =require("../helper/helper")
const arrivalDate = require('../controller/fetchArrivalDateByHotelName')
const app= Router();
app.get('/checkInDate',jwtTokenVerify,arrivalDate)
module.exports =app;