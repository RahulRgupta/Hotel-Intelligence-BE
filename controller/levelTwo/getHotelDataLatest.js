const { parse, format } = require('date-fns');
const hotelModel = require('../../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { month, year, startDate, endDate } = req.query; // Get hotelName and year from the query parameters

        // Check if month is provided and within a valid range (1 to 12)
        if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
            return res.status(400).json({ error: "Invalid month. Month must be a number between 1 and 12." });
        }

        let pipeline = []; // Initialize an empty aggregation pipeline
        // Add a $match stage to filter by records with isActive: true
        pipeline.push({
            $match: {
                isActive: "true"
            }
        });

        // if (year) {
        //     // // If year is provided in the query, split it into an array
        //     // const yearsArray = Array.isArray(year) ? year.map(Number) : [parseInt(year)];
        //     // Split the hotelName parameter into an array by commas
        //     const yearsArray = year.split(",").map(Number);

        //     // Add a $addFields stage to extract the year from bookingDate
        //     pipeline.push({
        //         $addFields: {
        //             bookingYear: { $year: { $toDate: "$arrivalDate" } }
        //         }
        //     });

        //     // Add a $match stage to filter by the specified years
        //     pipeline.push({
        //         $match: {
        //             bookingYear: { $in: yearsArray }
        //         }
        //     });
        // }

        // if (month) {
        //     // Split the hotelName parameter into an array by commas
        //     const monthsArray = month.split(",").map(Number);

        //     // Add a $addFields stage to extract the month from bookingDate
        //     pipeline.push({
        //         $addFields: {
        //             bookingMonth: { $month: { $toDate: "$arrivalDate" } }
        //         }
        //     });

        //     // Add a $match stage to filter by the specified months
        //     pipeline.push({
        //         $match: {
        //             bookingMonth: { $in: monthsArray }
        //         }
        //     });
        // }

        if (startDate && endDate) {
            const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
            const formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');

            const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
            const formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');
            pipeline.push({
                $match: {
                    $expr: {
                        $and: [
                            { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
                            { $lt: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
                        ]
                    }
                }
            })
        }

        // Add the $group stage to calculate revenue and roomNights by arrivalDate
        pipeline.push({
            $group: {
                _id: { month: "$bookingMonth", year: "$bookingYear" },
                revenue: { $sum: "$totalCharges" },
                roomNights: { $sum: "$noOfNights" },
                reservationCount: { $addToSet: "$res" }, // Count unique res values
                arrivalDate: { $addToSet: "$arrivalDate" },
                Lead: { $avg: "$lead" },
            }
        });

        // Add a $addFields stage to calculate ADR (Average Daily Rate)
        pipeline.push({
            $addFields: {
                adr: { $divide: ["$revenue", "$roomNights"] }
            }
        });

        // Add a $addFields stage to calculate LOS (Length of Stay)
        pipeline.push({
            $addFields: {
                los: {
                    $divide: ["$roomNights", { $size: "$reservationCount" }]
                }
            }
        });

        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {
            res.json({
                revenue: result[0].revenue,
                roomNights: result[0].roomNights,
                reservation: result[0].reservationCount.length,
                adr: result[0].adr, // ADR (Average Daily Rate)
                LOS: result[0].los,
                Lead: result[0].Lead,
                // arrivalDate: result[0].arrivalDate
            });
        } else {
            res.json({ revenue: 0, roomNights: 0, reservation: 0, adr: 0, LOS: 0, Lead: 0, arrivalDate: 0 });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}















// const hotelModel = require('../../models/hotelModel');

// module.exports = async (req, res) => {
//     try {
//         const { month, year } = req.query; // Get month and year from the query parameters

//         // Check if month is provided and within a valid range (1 to 12)
//         if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
//             return res.status(400).json({ error: "Invalid month. Month must be a number between 1 and 12." });
//         }

//         let pipeline = []; // Initialize an empty aggregation pipeline

//         if (year) {
//             // If year is provided in the query, split it into an array
//             const yearsArray = Array.isArray(year) ? year.map(Number) : [parseInt(year)];

//             // Add a $addFields stage to extract the year from arrivalDate
//             pipeline.push({
//                 $addFields: {
//                     bookingYear: { $year: { $toDate: "$arrivalDate" } }
//                 }
//             });

//             // Add a $match stage to filter by the specified years
//             pipeline.push({
//                 $match: {
//                     bookingYear: { $in: yearsArray }
//                 }
//             });
//         }

//         if (month) {
//             // If month is provided in the query, split it into an array
//             const monthsArray = Array.isArray(month) ? month.map(Number) : [parseInt(month)];

//             // Add a $addFields stage to extract the month from arrivalDate
//             pipeline.push({
//                 $addFields: {
//                     bookingMonth: { $month: { $toDate: "$arrivalDate" } }
//                 }
//             });

//             // Add a $match stage to filter by the specified months
//             pipeline.push({
//                 $match: {
//                     bookingMonth: { $in: monthsArray }
//                 }
//             });
//         }

//         // Add the $group stage to calculate the sum of noOfNights and revenue by arrivalDate
//         pipeline.push({
//             $group: {
//                 _id: { month: "$bookingMonth", year: "$bookingYear", arrivalDate: "$arrivalDate" },
//                 totalNoOfNights: { $sum: "$noOfNights" },
//                 //totalRevenue: { $sum: { $multiply: ["$noOfNights", "$ADR"] }}
//                 totalRevenue: { $sum: "$totalCharges"}
//             }
//         });

//         // Add the $addFields stage to calculate ADR by dividing totalRevenue by totalNoOfNights
//         pipeline.push({
//             $addFields: {
//                 ADR: { $divide: ["$totalRevenue", "$totalNoOfNights"] }
//             }
//         });

//         const result = await hotelModel.aggregate(pipeline);

//         if (result.length > 0) {
//             const arrivalDates = result.map(item => ({
//                 arrivalDate: item._id.arrivalDate,
//                 totalNoOfNights: item.totalNoOfNights,
//                 totalRevenue: item.totalRevenue,
//                 ADR: item.ADR
//             }));
//             res.json(arrivalDates);
//         } else {
//             res.json([]);
//         }
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// }
