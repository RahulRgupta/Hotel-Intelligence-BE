const {Router}=require('express')
const json =require('../controller/jsonUpload.js');
const {jwtTokenVerify} =require("../helper/helper")

const multer = require('multer');
const upload= multer()
const app=Router();
app.post('/uploadjson', upload.single('file'), json);
module.exports =app;
