const hotelModel =require('../models/hotelModel')


module.exports = async (req,res)=>{
    try{
        const uniqueHotelName = await hotelModel.distinct("hotelName");
        const uniqueHotelCode = await hotelModel.distinct("hotelCode");
          res.json({uniqueHotelName,uniqueHotelCode});
    }catch(error) {
        res.status(500).json({error: "Internal Server Error" })

    }
}