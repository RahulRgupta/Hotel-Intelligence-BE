const {Router}=require('express')
const pickUp =require('../controller/pickUp');
const app=Router();
app.get('/getPickUp',pickUp)
module.exports =app;
