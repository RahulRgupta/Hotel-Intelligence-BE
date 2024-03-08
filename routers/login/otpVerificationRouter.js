const {Router} =require('express')
const otpVerification =require('../../controller/login/otpVerification')
const app=Router()
app.post('/otpVerification',otpVerification)
module.exports =app;