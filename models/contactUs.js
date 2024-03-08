const mongoose = require("mongoose");
const conn1 = require("../conn/db");

// Define the schema
const contactusSchema = new mongoose.Schema({
  email : {
    type: String,
    required: true
  },
  description : {
    type: String
  }
}, { timestamps : true });

// Define the model

const ContactusSchema = conn1.model("contactus", contactusSchema)
module.exports = ContactusSchema;