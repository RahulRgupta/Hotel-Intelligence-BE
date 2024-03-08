const mongoose = require("mongoose");
const conn1 = require("../conn/db");
const Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

const loginSchema = new mongoose.Schema({
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
  hotelCode: [
    {
      hotelCode: {
        type: String,
      },
    },
  ],
  channel_manager: {
    type: String,
  },
  cmid: {
    type: Number,
  },
  cmcred: {
    type: Schema.Types.Map,
  },
  is_password_active: {
    type: Boolean,
    default: true,
  },
  is_connected:{
    type:String
  },
  otp:{
    default: "",
    type: String
},
time:{
    default: "",
    type: String
},
is_correct:{
  type:String,
  default:""
},
is_channelManager:{
  type:String,
},
is_credentialsChange:{
  type:String,
}
});

const hotellogin = conn1.model("registration", loginSchema);
module.exports = hotellogin;
