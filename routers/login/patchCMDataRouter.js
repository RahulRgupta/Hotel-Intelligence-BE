const {Router} =require('express')
const updateCMData =require('../../controller/login/patchCMData')
const app=Router()
app.patch('/updateCMData',updateCMData)
module.exports =app;