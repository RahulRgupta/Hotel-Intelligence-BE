const mongoose = require("mongoose");
const conn1 = require("../conn/db");


const inventoriesSchema = new mongoose.Schema({
    hotelCode: {
      type: String,
      default: ""
    },
    totalInvetory: {
      type: Number,
      default: 0
    },
    granular:[{
        roomName:{
            type:String,
            default:"",
        },
        inventory:{
            type:Number,
            default:"",
        }
    }]
  });
const inventories = conn1.model("inventories", inventoriesSchema)
module.exports = inventories