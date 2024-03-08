const mongoose = require("mongoose");
const conn1 = require("../conn/db");
// const randomstring = require("randomstring");


const hotelSchema = new mongoose.Schema({
    hotelName:{
        type:String,
        default:"",
    },
    res:{
        type:Number,
        default:"",
    },
    bookingDate:{
        type:String,
        default:"",
    },
    arrivalDate:{
        type:String,
        default:"",
    
    },
    deptDate:{
        type:String,
        default:"",
    },
    Room:{
        type:String,
        default:"",
    },
    Pax:{
        type:String,
        default:"",
    },
    ADR:{
        type:Number,
        default:"",
    },
    source:{
        type:String,
        default:"",
    },
    Lead:{
        type:Number,
        default:"",
    },
    noOfNights:{
        type:Number,
        default:"",
    },
    totalCharges:{
        type:Number,
        default:"",
    },
    guestName:{
        type:String,
        default:"",
    },
    isActive:{
        type:String,
        default:"false"
    }

  });

const hotelModel = conn1.model("hoteldatas", hotelSchema)
module.exports = hotelModel