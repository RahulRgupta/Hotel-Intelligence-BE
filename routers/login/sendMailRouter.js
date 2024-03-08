const {Router} =require('express')
const sendEmail =require('../../controller/login/sendMail')
const app=Router()
app.post('/sendMail',sendEmail)
module.exports =app;