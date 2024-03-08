const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode, dateFilter, cBase } = req.query;

        const currentDate = new Date();
        const todayDate = new Date(currentDate).toISOString().split('T')[0];
        const pipeline = []

        if (dateFilter === "Year") {
            const oneYearAgo = new Date(currentDate);
            oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

            const formattedOneYearAgo = oneYearAgo.toISOString().split('T')[0];
            pipeline.push({
                $match: {
                    arrivalDate: { $gte: formattedOneYearAgo, $lte: todayDate },
                }
            })
        }

        if (dateFilter === "Quarter") {
            const previousDate = new Date(currentDate);
            previousDate.setMonth(previousDate.getMonth() - 4);

            const formattedPreviousDate = `${previousDate.getFullYear()}-${(previousDate.getMonth() + 1).toString().padStart(2, '0')}-${previousDate.getDate().toString().padStart(2, '0')}`;

            pipeline.push({
                $match: {
                    arrivalDate: { $gte: formattedPreviousDate, $lte: todayDate }
                }
            })

        }

        if (dateFilter === "Month") {

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            const previousYear = month === 1 ? year - 1 : year;
            const previousMonth = month === 1 ? 12 : month - 1;

            const lastDayOfPreviousMonth = new Date(previousYear, previousMonth, 0).getDate();

            const previousMonthDate = new Date(previousYear, previousMonth - 1, Math.min(currentDate.getDate(), lastDayOfPreviousMonth));

            const formattedPreviousMonthDate = previousMonthDate.toISOString().split('T')[0];

            pipeline.push({
                $match: {
                    arrivalDate: { $gte: formattedPreviousMonthDate, $lte: todayDate }
                }
            })
        }
        
        pipeline.push({
            $match: {
                hotelCode: hotelCode,
            }
        })

        if (cBase === "Room to Room") {
            pipeline.push({
                $group: {
                    _id: "$room",
                    revenue: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$totalCharges", else: 0 } } },
                    lead: { $avg: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$lead", else: 0 } } },
                    roomNights: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$noOfNights", else: 0 } } },
                    reservationSet: { $addToSet: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$res", else: 0 } } },
                },
            })
            pipeline.push({
                $addFields: {
                    adr: {
                        $cond: {
                            if: { $ne: ["$roomNights", 0] },
                            then: { $divide: ["$revenue", "$roomNights"] },
                            else: 0
                        }
                    },
                    reservationCount: { $size: "$reservationSet" },
                }
            })
            pipeline.push({
                $addFields: {
                    los: {
                        $cond: {
                            if: { $ne: ["$reservationCount", 0] },
                            then: { $divide: ["$roomNights", "$reservationCount"] },
                            else: 0
                        }
                    },
                }
            })
            pipeline.push({
                $project: {
                    reservationSet: 0
                }
            })
        }

        if (cBase === "Source to Source") {
            pipeline.push({
                $group: {
                    _id: "$source",
                    revenue: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$totalCharges", else: 0 } } },
                    lead: { $avg: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$lead", else: 0 } } },
                    roomNights: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$noOfNights", else: 0 } } },
                    reservationSet: { $addToSet: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$res", else: 0 } } },
                },
            })
            pipeline.push({
                $addFields: {
                    adr: {
                        $cond: {
                            if: { $ne: ["$roomNights", 0] },
                            then: { $divide: ["$revenue", "$roomNights"] },
                            else: 0
                        }
                    },
                    reservationCount: { $size: "$reservationSet" },
                }
            })
            pipeline.push({
                $addFields: {
                    los: {
                        $cond: {
                            if: { $ne: ["$reservationCount", 0] },
                            then: { $divide: ["$roomNights", "$reservationCount"] },
                            else: 0
                        }
                    },
                }
            })
            pipeline.push({
                $project: {
                    reservationSet: 0
                }
            })
        }

        // if(cBase==="Time Period to Time Period") {}

        // console.log('pipeline: ', pipeline);

        const result = await hotelModel.aggregate(pipeline)

        const formattedResult = result.reduce((acc, curr) => {
            acc[curr._id] = {
                revenue: curr.revenue,
                roomNights: curr.roomNights,
                adr: curr.adr,
                reservationCount: curr.reservationCount,
                lead: curr.lead,
                los: curr.los
            };
            return acc;
        }, {});

        return res.status(200).json({ message: "comparison", formattedResult });

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: "Internal Server Error", statuscode: 500 });
    }
}