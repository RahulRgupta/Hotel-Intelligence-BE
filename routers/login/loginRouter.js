const {Router} =require('express')
const logindata =require('../../controller/login/login')
const app=Router()
app.post('/login',logindata)
module.exports =app;