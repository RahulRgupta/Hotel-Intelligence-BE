const {Router}=require('express')
const checkEMailRS =require('../controller/checkEmailInRs');
const app=Router();
app.post('/RS_login',checkEMailRS)
module.exports =app;
