const mongoose = require('mongoose');
const conn1 = mongoose.createConnection(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

if(conn1){
    console.log("Connected to db1")
}else{
    console.log("Not connected")
}
module.exports = conn1;
