const {Router}=require('express')
const request =require('../controller/request');
const app=Router();
app.post('/request',request)
module.exports =app;
