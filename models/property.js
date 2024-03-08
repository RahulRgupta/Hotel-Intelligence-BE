const mongoose = require("mongoose");
const conn2 = require("../conn/db2");

const propertySchema = new mongoose.Schema({
  rCode: {
    type: String,
    default: '',
  },
  user_id :[{
    type : mongoose.Schema.Types.ObjectId,
    ref : "user"
  }],
  hId: {
    type: Number,
    required: true,
  },
  hName: {
    type: String,
    required: true,
  },
  isRetvens: {
    type: Boolean,
    required: false,
  },
  compsetIds: {
    type: [Number],
  },
  activeOta: {
    type: [{
      otaId: {
        type: Number,
        required: true,
      },
      otaPId: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    }],
    required: true,
  }
});

const propertySchemaModel = conn2.model('property', propertySchema);

module.exports = propertySchemaModel;

