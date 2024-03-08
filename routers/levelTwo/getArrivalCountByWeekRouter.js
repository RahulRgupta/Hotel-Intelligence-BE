const {Router}=require('express')
const arrivalCountdata =require('../../controller/levelTwo/getArrivalCountByWeek');
const app=Router();
app.get('/arrivalCount',arrivalCountdata)
module.exports =app;