const hotelModel = require("../models/hotelModel");

module.exports = async (req, res) => {
  try {
    const { hotelName } = req.query; // Get hotelName from the query parameters

    let pipeline = []; // Initialize an empty aggregation pipeline

    if(!hotelName){
      return res
      .status(400)
      .json({
        error: "hotelName not found",
      });
    }
    
    // Add a $match stage to filter by records with isActive: true and the specified hotelName
    pipeline.push({
      $match: {
        isActive: "true",
        hotelName: hotelName, // Filter by the specified hotelName
        $expr: {
          $and: [
            { $gte: [{ $year: { $toDate: "$arrivalDate" } }, 2017] },
            { $lte: [{ $year: { $toDate: "$arrivalDate" } }, 2025] }
          ]
        }
      }
    });

    pipeline.push({
      $addFields: {
        bookingMonth: { $month: { $toDate: "$arrivalDate" } },
        bookingYear: { $year: { $toDate: "$arrivalDate" } },
      },
    });

    // Add the $group stage to calculate unique years and months
    pipeline.push({
      $group: {
        _id: { year: "$bookingYear", month: "$bookingMonth" },
      },
    });

    // Add a $addToSet stage to ensure unique years and months
    pipeline.push({
      $group: {
        _id: null,
        uniqueYears: { $addToSet: "$_id.year" },
        uniqueMonths: { $addToSet: "$_id.month" },
      },
    });

    // pipeline.push({
    //     $sort: {
    //       "uniqueYears": 1,
    //       "uniqueMonths": 1,
    //     },
    //   });

    const result = await hotelModel.aggregate(pipeline);

    if (result.length > 0) {
      // Extract unique years and months into separate arrays
      const uniqueYears = result[0].uniqueYears;
      const uniqueMonths = result[0].uniqueMonths;

            // Sort the uniqueYears and uniqueMonths arrays in ascending order
            uniqueYears.sort((a, b) => a - b);
            uniqueMonths.sort((a, b) => a - b);

      res.json({
        uniqueYears: uniqueYears,
        uniqueMonths: uniqueMonths,
      });
    } else {
      res.json({
        uniqueYears: [],
        uniqueMonths: [],
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
