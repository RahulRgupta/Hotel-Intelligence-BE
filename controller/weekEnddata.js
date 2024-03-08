const { parse, format } = require('date-fns');
const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelName, month, year, startDate, endDate } = req.query; // Get month and year from the query parameters


        if(!hotelName){
            return res
            .status(400)
            .json({
              error: "hotelName not found",
            });
          }
          
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

        if (hotelName) {
            // // If hotelName is provided in the query, split it into an array
            // const hotelNamesArray = Array.isArray(hotelName) ? hotelName : [hotelName];
            // Split the hotelName parameter into an array by commas
            const hotelNamesArray = hotelName.split(",");

            // Add a $match stage to filter by the specified hotelNames
            pipeline.push({
                $match: {
                    hotelName: { $in: hotelNamesArray }
                }
            });
        }

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
        //     // // If month is provided in the query, split it into an array
        //     // const monthsArray = Array.isArray(month) ? month.map(Number) : [parseInt(month)];

        //     // Split the hotelName parameter into an array by commas
        //     const monthsArray = month.split(",").map(Number);

        //     // Add a $addFields stage to extract the month from arrivalDate
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

        // Add a $addFields stage to determine if the arrivalDate is a weekday or weekend
        pipeline.push({
            $addFields: {
                isWeekend: {
                    $cond: [
                        {
                            $in: [{ $dayOfWeek: { $toDate: "$arrivalDate" } }, [1, 7]]
                        },
                        "weekend",
                        "weekday"
                    ]
                }
            }
        });

        // Add the $group stage to calculate the total revenue for each weekday and weekend
        pipeline.push({
            $group: {
                _id: "$isWeekend",
                totalRevenue: { $sum: "$totalCharges" },// Assuming totalCharges is the revenue field
                roomNights: { $sum: "$noOfNights" },
                reservationCount: { $addToSet: "$res" },
            }
        });

        // Add a $addFields stage to calculate ADR (Average Daily Rate)
        pipeline.push({
            $addFields: {
                adr: { $divide: ["$totalRevenue", "$roomNights"] },
                reservations: { $size: "$reservationCount" }
            }
        });

        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {
            const revenueByDayType = result.map(item => ({
                dayType: item._id,
                totalRevenue: item.totalRevenue,
                adr: item.adr,
                roomNights: item.roomNights,
                reservations: item.reservations
            }));
            res.json(revenueByDayType);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
