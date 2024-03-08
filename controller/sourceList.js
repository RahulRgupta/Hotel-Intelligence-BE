const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode } = req.query;


        if(!hotelCode){
            return res
            .status(400)
            .json({
              error: "hotelCode not found",
            });
          }
          
        let pipeline = [];

        if (hotelCode) {
            const hotelCodeArray = hotelCode.split(",");

            pipeline.push({
                $match: {
                    isActive: "true",
                    hotelCode: { $in: hotelCodeArray },
                },
            });

            pipeline.push({
                $group: {
                    _id: "$source",
                },
            });

            const result = await hotelModel.aggregate(pipeline);

            if (result.length > 0) {
                const uniqueSources = result.map((item) => item._id); // Extracting unique sources as an array of strings
                res.json({ source: uniqueSources });
            } else {
                res.json({ source: [] });
            }
        } else {
            res.json({ source: [] });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal Server Error" });
   
    }
}