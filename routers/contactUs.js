const { Router } = require('express')
const contactUs = require('../controller/contactUs');
const app = Router();
app.post('/contactus', contactUs)
module.exports = app;