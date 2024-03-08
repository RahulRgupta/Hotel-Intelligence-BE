const {Router}=require('express')
const sourceList =require('../controller/sourceList');
const {jwtTokenVerify} =require("../helper/helper")
const app=Router();
app.get('/sourceList',jwtTokenVerify,sourceList)
module.exports =app;