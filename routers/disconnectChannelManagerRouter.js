const {Router}=require('express')
const disconnectChannelManager =require('../controller/disconnectChannelManager');
const app=Router();
app.patch('/disconnectChannelManager',disconnectChannelManager)
module.exports =app;