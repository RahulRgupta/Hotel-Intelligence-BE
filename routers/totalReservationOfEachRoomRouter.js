const {Router}=require('express')
const reservation =require('../controller/totalReservationOFEachRoom');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();
app.get('/totalReservation',jwtTokenVerify,reservation)
module.exports =app;