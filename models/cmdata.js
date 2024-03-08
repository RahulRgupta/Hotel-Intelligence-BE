const mongoose = require("mongoose");
const conn1 = require("../conn/db")
const Schema = mongoose.Schema
// Define the schema
const cmSchema = new mongoose.Schema({
    
    hotelCode:{
        type:String
    },
  cmid: {
    type: Number
  },
  cmcred: {
    type: Schema.Types.Map,
  },
});

// Define the model

const CMModel = conn1.model("cmcred", cmSchema)
module.exports = CMModel