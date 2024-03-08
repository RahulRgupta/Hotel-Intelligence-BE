const {Router}=require('express')
const levelTwoChart =require('../../controller/levelTwo/getChartData');
const app=Router();
app.get('/getChartData',levelTwoChart)
module.exports =app;