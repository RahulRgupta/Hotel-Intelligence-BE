const {Router}=require('express')
const weekdata =require('../controller/weekEnddata');
const app=Router();
app.get('/weekdata',weekdata)
module.exports =app;