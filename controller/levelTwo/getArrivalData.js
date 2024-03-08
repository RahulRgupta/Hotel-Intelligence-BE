////
const { parse, format } = require('date-fns');
const hotelModel = require('../../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelName, year, startDate, endDate } = req.query; // Get month and year from the query parameters


        let pipeline = []; // Initialize an empty aggregation pipeline

        // Add a $match stage to filter by records with isActive: true
        pipeline.push({
            $match: {
                isActive: "true"
            }
        });

        if(!hotelName){
            return res
            .status(400)
            .json({
              error: "hotelName not found",
            });
          }


        if (hotelName) {
            // Split the hotelName parameter into an array by commas
            const hotelNamesArray = hotelName.split(",");

            // Add a $match stage to filter by the specified hotelNames
            pipeline.push({
                $match: {
                    hotelName: { $in: hotelNamesArray },
                },
            });

            // Add a $addFields stage to extract the year and month from arrivalDate
            pipeline.push({
                $addFields: {
                    bookingYear: { $year: { $toDate: "$arrivalDate" } },
                    bookingMonth: { $month: { $toDate: "$arrivalDate" } }
                }
            });
        }
        // if (year) {
        //     const yearsArray = year.split(",").map(Number);

        //     // Add a $addFields stage to extract the year and month from arrivalDate
        //     pipeline.push({
        //         $addFields: {
        //             bookingYear: { $year: { $toDate: "$arrivalDate" } },
        //             bookingMonth: { $month: { $toDate: "$arrivalDate" } }
        //         }
        //     });

        //     // Add a $match stage to filter by the specified years
        //     pipeline.push({
        //         $match: {
        //             bookingYear: { $in: yearsArray }
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

        // Add the $group stage to calculate the sum of noOfNights, ADR, and revenue by arrivalDate
        pipeline.push({
            $group: {
                _id: { month: "$bookingMonth", year: "$bookingYear" },
                totalNoOfNights: { $sum: "$noOfNights" },
                totalRevenue: { $sum: "$totalCharges" },
                revenue: { $sum: "$totalCharges" },
                roomNights: { $sum: "$noOfNights" },
                reservationCount: { $addToSet: "$res" }, // Count unique res values
                arrivalDate: { $addToSet: "$arrivalDate" },
                Lead: { $addToSet: "$lead" },
            }
        });

        // Add a $addFields stage to calculate LOS (Length of Stay)
        pipeline.push({
            $addFields: {
                los: { $divide: ["$roomNights", { $size: "$reservationCount" }] },
            },
        });




        //find specific date of sum of adr
        pipeline.push({
            $addFields: {
                totalADR: { $divide: ["$revenue", "$roomNights"] },
                totalReservation: { $size: "$reservationCount" }
            }
        });



        // Add a $sort stage to sort the results in ascending order of year and month
        pipeline.push({
            $sort: { "_id.year": 1, "_id.month": 1 }
        });

        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {

            const arrivalDates = result.map(item => ({
                month: item._id.month,
                year: item._id.year,
                totalNoOfNights: item.totalNoOfNights,
                totalADR: item.totalADR,
                totalRevenue: item.totalRevenue,
                totalReservation: item.totalReservation,
                LOS: item.los,
                Lead: item.Lead[0]
            }));
            res.json({ date: arrivalDates });
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}



// const hotelModel = require('../../models/hotelModel');

// module.exports = async (req, res) => {
//     try {
//         const { year } = req.query; // Get the year from the query parameters

//         let pipeline = []; // Initialize an empty aggregation pipeline

//         // Add a $match stage to filter by records with isActive: true
//         pipeline.push({
//             $match: {
//                 isActive: "true"
//             }
//         });

//         if (year) {
//             const yearsArray = year.split(",").map(Number);

//             // Add a $addFields stage to extract the year and month from arrivalDate
//             pipeline.push({
//                 $addFields: {
//                     bookingYear: { $year: { $toDate: "$arrivalDate" } },
//                     bookingMonth: { $month: { $toDate: "$arrivalDate" } }
//                 }
//             });

//             // Add a $match stage to filter by the specified years
//             pipeline.push({
//                 $match: {
//                     bookingYear: { $in: yearsArray }
//                 }
//             });
//         }

//         // Add the $group stage to calculate the sum of noOfNights, ADR, and revenue by year and month
//         pipeline.push({
//             $group: {
//                 _id: { month: "$bookingMonth", year: "$bookingYear" },
//                 totalNoOfNights: { $sum: "$noOfNights" },
//                 totalRevenue: { $sum: "$totalCharges" },
//                 revenue: { $sum: "$totalCharges" },
//                 roomNights: { $sum: "$noOfNights" },
//                 reservationCount: { $addToSet: "$res" },
//                 reservationtotal: { $sum: "$res" }, // Count unique res values
//                 arrivalDate: { $addToSet: "$arrivalDate" },
//                 Lead: { $avg: "$Lead" },
//             }
//         });

//         // Add a $addFields stage to calculate ADR (Average Daily Rate)
//         pipeline.push({
//             $addFields: {
//                 totalADR: { $divide: ["$revenue", "$roomNights"] }
//             }
//         });

//         const result = await hotelModel.aggregate(pipeline);

//         if (result.length > 0) {
//             const monthlyData = result.map(item => ({
//                 month: item._id.month,
//                 year: item._id.year,
//                 totalNoOfNights: item.totalNoOfNights,
//                 totalADR: item.totalADR,
//                 totalRevenue: item.totalRevenue,
//                 totalReservation:item.reservationtotal
//             }));
//             res.json({ data: monthlyData });
//         } else {
//             res.json([]);
//         }
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// }
