const reqData = require("../../models/req");
const admin = require("../../models/login")

module.exports = async (req, res) => {
  try {
    const { userId, channel_manager, cmid, cmcred } = req.body;

    if(!userId){
        return res.status(400).json({message:"pls enter userId"})
    }

    // Find the user by userId
    let updatedDoc = await reqData.findOne({ userId: userId });
    let updateAdmin = await admin.findOne({ userId: userId });

 if(!updatedDoc && !updateAdmin){
    return res.status(200).json({message:"invaild userId or user not found"})
 }
   

    // Update the fields if they exist or add them if they don't
    if (channel_manager !== undefined) {
      updatedDoc.channel_manager = channel_manager;
    }
    if (cmid !== undefined) {
      updatedDoc.cmid = cmid;
    }
    if (cmcred !== undefined) {
      updatedDoc.cmcred = cmcred;
    }

     // Set is_channelManager field to true
     updatedDoc.is_channelManager = true;
   const is_credentialsChange = updatedDoc?.is_credentialsChange || ""
     //set is_credentialsChange field to true
     if(is_credentialsChange=="false"){
      updatedDoc.is_credentialsChange = true;
     }

    // Save the updated document
    await updatedDoc.save();

    if (!updateAdmin?.is_password_active && !updatedDoc?.is_password_active) {
      // Update fields in updateAdmin if is_password_active is false
      updateAdmin.channel_manager = channel_manager;
      updateAdmin.cmid = cmid;
      updateAdmin.cmcred = cmcred;
      updateAdmin.is_credentialsChange = true;

      await updateAdmin.save();
    }

    return res.json({ message: 'CM data updated successfully' });

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal Server Error" });
  }
};
