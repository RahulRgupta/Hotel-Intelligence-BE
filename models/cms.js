const mongoose = require("mongoose");
const conn1 = require("../conn/db")
// Define the schema
const cmSchema = new mongoose.Schema({
  cmid: {
    type: Number
  },
  cmname: {
    type: String
  },
  cmcred: {
    type: [String]
  }
});

// Define the model

const CMModel = conn1.model("cm", cmSchema)
module.exports = CMModel


