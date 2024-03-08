const hotelModel = require('../models/hotelModel')

module.exports = async (req, res) => {
    try {
        const hotelCode = req.query.hotelCode

        const filters = await hotelModel.aggregate([
            {
                $match: {
                    hotelCode,
                    room: { $ne: null, $ne: "null", $ne: "" },
                    source: { $ne: null, $ne: "null", $ne: "NULL", $ne: "" }
                }
            },
            {
                $group: {
                    _id: null,
                    rooms: { $addToSet: "$room" },
                    sources: { $addToSet: "$source" },
                }
            },
            {
                $addFields:{
                    timePeriod:["All","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
                }
            },
            {
                $project: {
                    _id: 0,
                    rooms: 1,
                    sources: 1,
                    timePeriod:1
                }
            }
        ]);


        return res.status(200).json({ message: "filters", filters: { rooms: ["All", ...filters[0].rooms], sources: ["All", ...filters[0].sources] ,timePeriod:filters[0].timePeriod} });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error", statuscode: 500 });
    }
}