const {Router}=require('express')
const arrivaldata =require('../../controller/levelTwo/getArrivalData');
const app=Router();
app.get('/arrivalData',arrivaldata)
module.exports =app;