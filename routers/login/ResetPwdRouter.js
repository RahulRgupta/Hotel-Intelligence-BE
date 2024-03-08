const {Router} =require('express')
const resetPassword =require('../../controller/login/forgetPassword')
const app=Router()
app.patch('/resetPassword',resetPassword)
module.exports =app;