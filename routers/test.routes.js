const {Router}=require('express')
const test =require('../controller/test');
const app=Router();
app.put('/update',test)
module.exports =app;
