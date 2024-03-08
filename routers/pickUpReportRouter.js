const { Router } = require('express')
const pickUpdata = require('../controller/pickUpReport')
const { jwtTokenVerify } = require("../helper/helper")
const app = Router()
app.get('/pickUpData', jwtTokenVerify, pickUpdata)
module.exports = app