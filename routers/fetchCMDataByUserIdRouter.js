const {Router}=require('express')

const cmData = require('../controller/fetchCMDataByUserId')
const app= Router();
app.get('/fetchCmData',cmData)
module.exports =app;