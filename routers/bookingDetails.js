const {Router}=require('express')
const bookingDetails =require('../controller/bookingDetails');
const app=Router();
app.post('/bookingDetails',bookingDetails)
module.exports =app;