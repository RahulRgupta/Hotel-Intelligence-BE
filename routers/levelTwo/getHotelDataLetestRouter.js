const {Router}=require('express')
const latesthoteldata =require('../../controller/levelTwo/getHotelDataLatest');
const app=Router();
app.get('/latestData',latesthoteldata)
module.exports =app;