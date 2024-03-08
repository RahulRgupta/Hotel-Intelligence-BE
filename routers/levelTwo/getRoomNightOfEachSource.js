const {Router}=require('express')
const latesthoteldata =require('../../controller/levelTwo/getRoomNightOfEachSource');
const {jwtTokenVerify} =require("../../helper/helper")
const app=Router();
app.get('/sourceData',jwtTokenVerify,latesthoteldata)
module.exports =app;