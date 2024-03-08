
const hotelModel = require('../models/hotelModel');


// POST API endpoint to check and save data
module.exports = async (req, response) => {
    try {
      // Extract data from the request body
      const { hotelName, res,hotelCode, bookingDate,arrivalDate,deptDate,room,pax,ADR,source,lead,noOfNights,totalCharges,guestName} = req.body;
  
      // Check if the combination of res and hotelcode
      const existingRecord = await hotelModel.findOne({ res,hotelCode });
  
      if (existingRecord) {
        return response.status(400).json({ error: 'Duplicate entry for res,hotelcode' });
      }
  
      // If not duplicate, save the data to the database
      const newHotelrecord = new hotelModel({  hotelName, res,hotelCode, bookingDate,arrivalDate,deptDate,room,pax,ADR,source,lead,noOfNights,totalCharges,guestName});
      await newHotelrecord.save();
  
      return response.status(201).json({ message: 'Data saved successfully' });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
