const hotelModel = require("../../models/hotelModel");

module.exports = async (req, res) => {
  try {
    const { month, year } = req.query; // Get month and year from the query parameters
   

    // Check if month is provided and within a valid range (1 to 12)
    if (
      month &&
      (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)
    ) {
      return res
        .status(400)
        .json({
          error: "Invalid month. Month must be a number between 1 and 12.",
        });
    }

    let pipeline = []; // Initialize an empty aggregation pipeline

         // Add a $match stage to filter by records with isActive: true
        pipeline.push({
          $match: {
              isActive: "true"
          }
      });

    if (year) {
      // // If year is provided in the query, split it into an array
      // const yearsArray = Array.isArray(year)
      //   ? year.map(Number)
      //   : [parseInt(year)];

                                    // Split the hotelName parameter into an array by commas
                                    const yearsArray = year.split(",").map(Number);

      // Add a $addFields stage to extract the year from bookingDate
      pipeline.push({
        $addFields: {
          bookingYear: { $year: { $toDate: "$arrivalDate" } },
        },
      });

      // Add a $match stage to filter by the specified years
      pipeline.push({
        $match: {
          bookingYear: { $in: yearsArray },
        },
      });
    }

    if (month) {
      // // If month is provided in the query, split it into an array
      // const monthsArray = Array.isArray(month)
      //   ? month.map(Number)
      //   : [parseInt(month)];

                                    // Split the hotelName parameter into an array by commas
                                    const monthsArray = month.split(",").map(Number);

      // Add a $addFields stage to extract the month from bookingDate
      pipeline.push({
        $addFields: {
          bookingMonth: { $month: { $toDate: "$arrivalDate" } },
        },
      });

      // Add a $match stage to filter by the specified months
      pipeline.push({
        $match: {
          bookingMonth: { $in: monthsArray },
        },
      });
    }

    // Add a $addFields stage to extract the week from arrivalDate
    pipeline.push({
      $addFields: {
        bookingWeek: { $week: { $toDate: "$arrivalDate" } },
      },
    });

    // Add the $group stage to calculate revenue per week, year, and month
    pipeline.push({
      $group: {
        _id: { week: "$bookingWeek", year: "$bookingYear", month: "$bookingMonth" },
        revenue: { $sum: "$totalCharges" },
        roomNights: { $sum: "$noOfNights" },
      },
    });

    // Add a $addFields stage to calculate ADR (Average Daily Rate) per week, year, and month
    pipeline.push({
      $addFields: {
        adr: { $divide: ["$revenue", "$roomNights"] },
      },
    });

        // Add a $sort stage to sort the results by week in ascending order
        pipeline.push({
          $sort: {
            "_id.week": 1,
          },
        });

    const result = await hotelModel.aggregate(pipeline);

    if (result.length > 0) {
      res.json({
        weeklyData: result,
      });
    } else {
      res.json({ weeklyData: [] });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
