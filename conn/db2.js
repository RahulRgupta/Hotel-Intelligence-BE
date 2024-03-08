const mongoose = require('mongoose');
const conn2 = mongoose.createConnection(process.env.DATABASE2, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

if(conn2){
    console.log("Connected to db2")
}else{
    console.log("Not connected")
}
module.exports = conn2;
