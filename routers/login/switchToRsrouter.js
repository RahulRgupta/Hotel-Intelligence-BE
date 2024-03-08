const {Router} =require('express')
const rs =require('../../controller/login/switchToRateSoppher');
const { jwtTokenVerify } = require('../../helper/helper');
const app=Router()
app.post('/switchToRs',jwtTokenVerify,rs)
module.exports =app;