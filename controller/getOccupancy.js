const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode } = req.query;

        if (!hotelCode) {
            return res
                .status(400)
                .json({
                    message: "Please enter a hotel code first", statuscode: 400
                });
        }
        const date = new Date();
        const today = date.toISOString().split("T")[0];

        const yesterdayDate = new Date(date);
        yesterdayDate.setDate(date.getDate() - 1);

        const yesterday = yesterdayDate.toISOString().split("T")[0];


        const occupancy = await hotelModel.aggregate([
            {
                $match: {
                    isActive: "true",
                    hotelCode: hotelCode,
                    $or: [
                        { arrivalDate: { $gte: yesterday, $lte: today } },
                        { deptDate: { $gte: yesterday, $lte: today } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    arrivals: {
                        $sum: {
                            $cond: [
                                { $eq: ["$arrivalDate", today] },
                                1,
                                0
                            ]
                        }
                    },
                    roomNights: {
                        $sum: {
                            $cond: [
                                { $eq: ["$arrivalDate", today] }, 
                                "$noOfNights", 
                                0 
                            ]
                        }
                    },
                    yesterdayArrivals: {
                        $sum: {
                            $cond: [
                                { $eq: ["$arrivalDate", yesterday] },
                                1,
                                0
                            ]
                        }
                    },
                    departure: {
                        $sum: {
                            $cond: [
                                { $eq: ["$deptDate", today] },
                                1,
                                0
                            ]
                        }
                    },
                    yesterdayDeparture: {
                        $sum: {
                            $cond: [
                                { $eq: ["$deptDate", yesterday] },
                                1,
                                0
                            ]
                        }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$arrivalDate", today] },
                                "$totalCharges",
                                0
                            ]
                        }
                    },
                    yesterdayTotalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$arrivalDate", yesterday] },
                                "$totalCharges",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "inventories",
                    localField: hotelCode,
                    foreignField: hotelCode,
                    as: "inventory",
                }
            },
            {
                $unwind: "$inventory"
            },
            {
                $addFields: {
                    totalRoom: "$inventory.totalInvetory",
                    availableRoom: { $subtract: ["$inventory.totalInvetory", "$arrivals"] },
                    yesterdayAvailableRoom: { $subtract: ["$inventory.totalInvetory", "$yesterdayArrivals"] },
                    ADR: {
                        $cond: [
                            { $ne: ["$arrivals", 0] },
                            { $divide: ["$totalRevenue", "$arrivals"] },
                            0
                        ]
                    },
                    yesterdayADR: {
                        $cond: [
                            { $ne: ["$yesterdayArrivals", 0] },
                            { $divide: ["$yesterdayTotalRevenue", "$yesterdayArrivals"] },
                            0
                        ]
                    }
                }
            },
            {
                $addFields: {
                    occupancy: {
                        $cond: [
                            { $and: [{ $ne: ["$arrivals", 0] }, { $ne: ["$availableRoom", 0] }] },
                            {
                                $multiply: [
                                    { $divide: ["$arrivals", "$availableRoom"] },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    yesterdayOccupancy: {
                        $cond: [
                            { $and: [{ $ne: ["$yesterdayArrivals", 0] }, { $ne: ["$yesterdayAvailableRoom", 0] }] },
                            {
                                $multiply: [
                                    { $divide: ["$yesterdayArrivals", "$yesterdayAvailableRoom"] },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    arrivals: 1,
                    roomNights: 1,
                    yesterdayArrivals: 1,
                    departure: 1,
                    yesterdayDeparture: 1,
                    totalRoom: 1,
                    availableRoom: 1,
                    yesterdayAvailableRoom: 1,
                    totalRevenue: 1,
                    yesterdayTotalRevenue: 1,
                    ADR: 1,
                    yesterdayADR: 1,
                    occupancy: 1,
                    yesterdayOccupancy: 1,
                    revpar: {
                        $cond: [
                            { $and: [{ $ne: ["$ADR", 0] }, { $ne: ["$occupancy", 0] }] },
                            {
                                $divide: [
                                    { $multiply: ["$ADR", "$occupancy"] },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    yesterdayRevpar: {
                        $cond: [
                            { $and: [{ $ne: ["$yesterdayADR", 0] }, { $ne: ["$yesterdayOccupancy", 0] }] },
                            {
                                $divide: [
                                    { $multiply: ["$yesterdayADR", "$yesterdayOccupancy"] },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ])

        return res.status(200).json({ message: "Today's Occupancy", statuscode: 200, data: occupancy })
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: "Internal Server Error", statuscode: 500 });
    }
}