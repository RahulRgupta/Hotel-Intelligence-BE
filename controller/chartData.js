const { parse, format } = require('date-fns');
const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelName, year, month, startDate, endDate } = req.query; // Get hotelName and year from the query parameters

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

        // Add a $addFields stage to extract the year from bookingDate
        pipeline.push({
            $addFields: {
                bookingYear: { $year: { $toDate: "$arrivalDate" } }
            }
        });

        // Add a $addFields stage to extract the month from bookingDate
        pipeline.push({
            $addFields: {
                bookingMonth: { $month: { $toDate: "$arrivalDate" } }
            }
        });

        // Add a $addFields stage to extract the source field (corrected to use "source")
        pipeline.push({
            $addFields: {
                source: "$source"
            }
        });

        //     if (year) {
        //         // // If year is provided in the query, split it into an array
        //         // const yearsArray = Array.isArray(year) ? year.map(Number) : [parseInt(year)];

        //                   // Split the hotelName parameter into an array by commas
        //             const yearsArray = year.split(",").map(Number);

        //         // Add a $match stage to filter by the specified years
        //         pipeline.push({
        //             $match: {
        //                 bookingYear: { $in: yearsArray }
        //             }
        //         });
        //     }

        //     if (month) {
        //         // // If month is provided in the query, split it into an array
        //         // const monthsArray = Array.isArray(month) ? month.map(Number) : [parseInt(month)];

        //                   // Split the hotelName parameter into an array by commas
        //   const monthsArray = month.split(",").map(Number);

        //         // Add a $match stage to filter by the specified months
        //         pipeline.push({
        //             $match: {
        //                 bookingMonth: { $in: monthsArray }
        //             }
        //         });
        //     }

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

        // Add the $group stage to calculate revenue and room nights for each source
        pipeline.push({
            $group: {
                _id: { source: "$source" },
                revenue: { $sum: "$totalCharges" },
                roomNights: { $sum: "$noOfNights" },
            }
        });

        // Add a $addFields stage to calculate ADR (Average Daily Rate) for each source
        pipeline.push({
            $addFields: {
                adr: {
                    $cond: {
                        if: { $gt: ["$roomNights", 0] }, // Check if roomNights > 0 to avoid division by zero
                        then: { $divide: ["$revenue", "$roomNights"] },
                        else: null, // Set ADR to null if roomNights = 0
                    }
                }
            }
        });

        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {
            res.json({ adrAndRoomNightsBySource: result });
        } else {
            res.json({ adrAndRoomNightsBySource: [] });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}
