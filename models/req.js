const mongoose = require("mongoose");
const conn1 = require("../conn/db");
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

const reqSchema = new mongoose.Schema({
  userId:{
    type:String,
    default:''
  },
  email: {
    type: String,
    required:true
  },
  password: {
    type: String,
    required:true,
  },
  channel_manager: {
    type: String,
  },
  cmid:{
    type:Number
  },
  cmcred: {
    type: Schema.Types.Map,
  },
  is_password_active: {
    type: Boolean,
    default: true,
  },
  is_correct:{
    type:String,
    default:""
  },
  is_channelManager:{
    type:String,
    default:"false"
  },
  is_credentialsChange:{
    type:String,
  }
});

const userReq = conn1.model("request", reqSchema);
module.exports = userReq;
