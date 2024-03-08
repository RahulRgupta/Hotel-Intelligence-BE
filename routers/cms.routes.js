const {Router}=require('express')
const cmList =require('../controller/cmsList');
const app=Router();
app.get('/cm_list',cmList)
module.exports =app;
