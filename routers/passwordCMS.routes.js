const {Router}=require('express')
const CMSPassword =require('../controller/CMSPassword');
const app=Router();
app.patch('/pass_cms',CMSPassword)
module.exports =app;
