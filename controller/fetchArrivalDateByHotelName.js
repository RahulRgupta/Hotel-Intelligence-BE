const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode } = req.query; // Assuming hotelName is obtained from the request body
        
        if(!hotelCode){
            return res
            .status(400)
            .json({
              error: "hotelcode not found",
            });
          }

          
            // Find the documents based on hotelName, sort by arrivalDate in ascending and descending order
        const oldestArrival = await hotelModel.find({ hotelCode })
        .sort({ arrivalDate: 1 })
        .limit(1)
        .select('arrivalDate')
        .lean();

        
        // Find the document based on hotelName, sort by arrivalDate in descending order, and select the latest one
        const latestArrival = await hotelModel.find({ hotelCode })
            .sort({ arrivalDate: -1 })
            .select('arrivalDate')
            .lean(); // Use lean() to get a plain JavaScript object
        
        if (!latestArrival || !oldestArrival) {
            return res.status(404).json({ error: "No records found for the provided hotelName" });
        }
        
        // Extracting just the arrivalDate field from the result objects
        const oldest = oldestArrival.length ? oldestArrival[0].arrivalDate : "";
        const latest = latestArrival.length ? latestArrival[0].arrivalDate : "";

        res.status(200).json({ oldestArrival: oldest, latestArrival: latest });
    } catch (error) {
        console.log(error)

        res.status(500).json({ error: "Internal Server Error" });
    }
};
