const userReq = require("../models/req");
const registration = require("../models/login");


module.exports =async (req,res)=>{
    try{
        const { email } = req.body;
        // Find the document by email and update the is_correct field
    const updatedDoc = await registration.findOneAndUpdate(
        { email: email },
        { $set: { is_connected: "false" } },
        { new: true } // To get the updated document
      );
  
      if (!updatedDoc) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      return res.json({ message: 'channel manager disconnected successfully' });

    }catch(error){
        res.status(500).json({error: "Internal Server Error" })

    }
}
