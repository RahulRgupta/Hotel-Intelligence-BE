const { Router } = require('express')
const ExistEmail = require('../controller/emailExist');
const app = Router();
app.get('/email-check', ExistEmail)
module.exports = app;