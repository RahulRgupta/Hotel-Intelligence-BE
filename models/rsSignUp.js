const mongoose = require("mongoose");
const conn2 = require("../conn/db2");

const rsloginSchema = new mongoose.Schema({
    role: { type: String, enum: ["USER","ADMIN"], default: "USER" },
    user_status: { type: String, enum: ["ACTIVE", "INACTIVE", "DELETED"] },
    is_login: { type: Number },
    is_active: { type: Number, default: 1 },
    is_deleted: { type: Number, default: 0 },
    is_profile_completed: { type: Number, default: 0 },
    name: { type: String },
    email: { type: String },
    password: { type: String },
    created_at: { type: Date, default: new Date() },
    updated_at: { type: Date },
    added_by:{type:String,enum:["ADMIN","SELF"]},
    recent_property : {
      type : mongoose.Types.ObjectId,
      ref : "property"
    },
    reason : {
      type : String
    }
  },
  { versionKey: false }
);

const rsLogin = conn2.model("users", rsloginSchema);
module.exports = rsLogin;