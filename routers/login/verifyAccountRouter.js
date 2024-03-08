const {Router} =require('express')
const verifyAccount =require('../../controller/login/verifyAccount')
const app=Router()
app.post('/verifyAccount',verifyAccount)
module.exports =app;