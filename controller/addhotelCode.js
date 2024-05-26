//model
const hotelModel = require('../models/hotelModel')
const userModel = require('../models/login')
module.exports = async (req,res) =>{
    try{
        const {userId,hotelCode}= req.body

        const findUser = await userModel.findOne({userId})

        if(!findUser){
            return res.status(200).json({message:"user not found"})
        }

       await userModel.updateOne({userId},{$push:{hotelCode:hotelCode}})
   
       return res.json({ message: 'Hotel code updated successfully' });

    }catch(error){
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}