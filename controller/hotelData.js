const { parse, format } = require("date-fns");
const hotelModel = require("../models/hotelModel");

module.exports = async (req, res) => {
  try {
    const { hotelCode, year, month, startDate, endDate, selector, source } = req.query; // Get hotelName and year from the query parameters
 
    if(!hotelCode){
      return res
      .status(400)
      .json({
        error: "hotelcode not found",
      });
    }
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
        isActive: "true",
        $expr: {
          $and: [
            { $gte: [{ $year: { $toDate: "$arrivalDate" } }, 2017] },
            { $lte: [{ $year: { $toDate: "$arrivalDate" } }, 2025] }
          ]
        }
      }
    });


    if (hotelCode) {
      // Split the hotelName parameter into an array by commas
      const hotelCodeArray = hotelCode.split(",");

      // Add a $match stage to filter by the specified hotelNames
      pipeline.push({
        $match: {
          hotelCode: { $in: hotelCodeArray },
        },
      });
    }

    if (source) {
      const sourceArray = source.split(",");
      pipeline.push({
        $match: {
          source: { $in: sourceArray }
        }
      });
    }

    // }

    if (startDate && endDate) {
      const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
      const formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');
     
      

      const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
      const formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');
   
      const differenceInDays = Math.floor((parsedDate_start - parsedDate_end) / (1000 * 60 * 60 * 24));
      console.log(differenceInDays)
      pipeline.push({
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
              { $lte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
            ]
          }
        }
      })
    }

   
    // grouping according to selector params
    switch (selector) {
      case 'yearly': {
        pipeline.push({
          $group: {
            _id: {},
            revenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
            reservationSet: { $addToSet: "$res" }, // Count unique res values
            Lead: { $avg: "$lead" },
            // uniqueYears: { $addToSet: { $year: { $toDate: "$arrivalDate" } } },
            // uniqueMonths: { $addToSet: { $month: { $toDate: "$arrivalDate" } } },
            totalRecords: { $sum: 1 },
          },
        });
        break;
      }
      case 'monthly': {
        pipeline.push({
          $group: {
            _id: { $month: { $toDate: "$arrivalDate" } },
            revenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
            reservationSet: { $addToSet: "$res" }, // Count unique res values
            Lead: { $avg: "$Lead" },
            // uniqueYears: { $addToSet: { $year: { $toDate: "$arrivalDate" } } },
            // uniqueMonths: { $addToSet: { $month: { $toDate: "$arrivalDate" } } },
            totalRecords: { $sum: 1 },
          },
        });
        break;
      }
      case 'quarterly': {
        pipeline.push({
          $group: {
            _id: {
              $ceil: {
                $divide: [
                  { $month: { $toDate: "$arrivalDate" } },
                  3
                ]
              }
            },
            revenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
            reservationSet: { $addToSet: "$res" }, // Count unique res values
            Lead: { $avg: "$lead" },
            // uniqueYears: { $addToSet: { $year: { $toDate: "$arrivalDate" } } },
            // uniqueMonths: { $addToSet: { $month: { $toDate: "$arrivalDate" } } },
            totalRecords: { $sum: 1 }
          },
        });
        break;
      }
      default: {
        pipeline.push({
          $group: {
            _id: {},
            revenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
            reservationSet: { $addToSet: "$res" }, // Count unique res values
            Lead: { $avg: "$lead" },
            // uniqueYears: { $addToSet: { $year: { $toDate: "$arrivalDate" } } },
            // uniqueMonths: { $addToSet: { $month: { $toDate: "$arrivalDate" } } },
            totalRecords: { $sum: 1 },
          },
        });
      }
    }



    // Add a $addFields stage to calculate ADR (Average Daily Rate)
    pipeline.push({
      $addFields: {
        adr: { $divide: ["$revenue", "$roomNights"] }
      },
    });



    // Add a $addFields stage to calculate LOS (Length of Stay)
    pipeline.push({
      $addFields: {
        los: { $divide: ["$roomNights", { $size: "$reservationSet" }] },
        reservationCount: { $size: "$reservationSet" },
      },
    });

    pipeline.push({
      $project: {
        reservationSet: 0, // Exclude the reservationSet field
        uniqueMonths: 0
      }
    });

    // Add a $sort stage to sort uniqueYears in ascending order
    pipeline.push({
      $sort: {
        "uniqueYears": 1,
      },
    });

    const result = await hotelModel.aggregate(pipeline);

    if (result.length > 0) {
      let ans = []
      if (selector === 'monthly') {
        result.map(r => {
          if ((r._id == new Date(startDate).getMonth() + 1) || (r._id == new Date(endDate).getMonth() + 1)) {
            ans.push(r)
          }
        })
        return res.json(ans);
      }
      res.json(result);
    } else {
      res.json([
        {
            "description": "_id",
            "value": {}
        },
        {
            "description": "revenue",
            "value": 0
        },
        {
            "description": "roomNights",
            "value": 0
        },
        {
            "description": "Lead",
            "value": 0
        },
        {
            "description": "totalRecords",
            "value": 0
        },
        {
            "description": "adr",
            "value": 0
        },
        {
            "description": "los",
            "value": 0
        },
        {
            "description": "reservationCount",
            "value": 0
        }
    ]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

