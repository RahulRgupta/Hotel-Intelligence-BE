const mongoose = require("mongoose");
const conn1 = require("../conn/db");
// const randomstring = require("randomstring");


const hotelSchema = new mongoose.Schema({
    hotelName:{
        type:String,
        default:"",
    },
    res:{
        type:String,
        default:"",
    },
    hotelCode:{
        type:String,
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
    room:{
        type:String,
        default:"",
    },
    pax:{
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
    lead:{
        type:Number,
       
    },
    noOfNights:{
        type:Number,
      
    },
    totalCharges:{
        type:Number,
        
    },
    guestName:{
        type:String,
        default:"",
    },
    isActive:{
        type:String,
        default:""
    }

  });

const hotelRecord = conn1.model("hotelrecord", hotelSchema)
module.exports = hotelRecord