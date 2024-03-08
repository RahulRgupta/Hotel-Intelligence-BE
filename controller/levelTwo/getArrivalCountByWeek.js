const hotelModel = require('../../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { month } = req.query; // Get month and year from the query parameters

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

        if (month) {
            // // If month is provided in the query, split it into an array
            // const monthsArray = Array.isArray(month) ? month.map(Number) : [parseInt(month)];

                  // Split the hotelName parameter into an array by commas
      const monthsArray = month.split(",").map(Number);

            // Add a $addFields stage to extract the month from arrivalDate
            pipeline.push({
                $addFields: {
                    bookingMonth: { $month: { $toDate: "$arrivalDate" } }
                }
            });

            // Add a $match stage to filter by the specified months
            pipeline.push({
                $match: {
                    bookingMonth: { $in: monthsArray }
                }
            });
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

        // Add the $group stage to count the number of arrivals for each weekday and weekend
        pipeline.push({
            $group: {
                _id: "$isWeekend",
                totalArrivals: { $sum: 1 }
            }
        });

        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {
            const arrivalCounts = result.map(item => ({
                dayType: item._id,
                totalArrivals: item.totalArrivals
            }));
            res.json(arrivalCounts);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
