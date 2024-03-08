const { parse, format, subYears } = require("date-fns");
const { formatDate } = require('../helper/helper');
const hotelModel = require("../models/hotelModel");

module.exports = async (req, res) => {
  try {
    const { hotelCode } = req.query;

    let todayDate = new Date();
    todayDate = formatDate(todayDate);
    const parsedDate_start = parse(todayDate, 'dd-MM-yyyy', new Date());
    const formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');

    if (!hotelCode) {
      return res.status(400).json({
        error: "hotelcode not found",
      });
    }

    let currentYearPipeline = [];

    currentYearPipeline.push({
      $match: {
        //isActive: "true",
        arrivalDate: {
          $lte: formattedDate_start,
        },
        deptDate: {
          $gt: formattedDate_start,
        },
        hotelCode: { $in: hotelCode.split(",") },
      },
    });

    currentYearPipeline.push({
      $group: {
        _id: {},
        revenue: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$totalCharges", else: 0 } } },
        roomNights: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$noOfNights", else: 0 } } },
        reservationSet: { $addToSet: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$res", else: 0 } } },    
        cancellations: { $sum: { $cond: { if: { $eq: ["$isActive", "false"] }, then: 1, else: 0 } } },
      },
    });

    

    currentYearPipeline.push({
      $addFields: {
        adr: {
          $cond: {
            if: { $gt: ["$roomNights", 0] },
            then: { $divide: ["$revenue", "$roomNights"] },
            else: 0  // or any default value you want when roomNights is zero
          }
        },
        reservationCount: { $size: "$reservationSet" },
        cancellations: "$cancellations",
      },
    });
    currentYearPipeline.push({
      $addFields: {
       // adr: { $divide: ["$revenue", "$roomNights"] },
       // reservationCount: { $size: "$reservationSet" },
        perDayRevenue: { $multiply: ["$adr", "$reservationCount"] },
      },
    });

    currentYearPipeline.push({
      $project: {
        reservationSet: 0,
      },
    });

    // Get the same day from the previous year
    const previousYearDate = format(subYears(parsedDate_start, 1), 'yyyy-MM-dd');
    let previousYearPipeline = [];

    previousYearPipeline.push({
      $match: {
       // isActive: "true",
        arrivalDate: {
          $lte: previousYearDate,
        },
        deptDate: {
          $gt: previousYearDate,
        },
        hotelCode: { $in: hotelCode.split(",") },
      },
    });

    previousYearPipeline.push({
      $group: {
        _id: {},
        revenue: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$totalCharges", else: 0 } } },
        roomNights: { $sum: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$noOfNights", else: 0 } } },
        reservationSet: { $addToSet: { $cond: { if: { $eq: ["$isActive", "true"] }, then: "$res", else: 0 } } },   
        cancellations: { $sum: { $cond: { if: { $eq: ["$isActive", "false"] }, then: 1, else: 0 } } },

      },
    });

    previousYearPipeline.push({
      $addFields: {
        adr: {
          $cond: {
            if: { $gt: ["$roomNights", 0] },
            then: { $divide: ["$revenue", "$roomNights"] },
            else: 0  // or any default value you want when roomNights is zero
          }
        },
        reservationCount: { $size: "$reservationSet" },
        cancellations: "$cancellations",
      },
    });

    previousYearPipeline.push({
      $addFields: {
        //adr: { $divide: ["$revenue", "$roomNights"] },
       // reservationCount: { $size: "$reservationSet" },
        perDayRevenue: { $multiply: ["$adr", "$reservationCount"] },
      },
    });

    previousYearPipeline.push({
      $project: {
        reservationSet: 0,
      },
    });

    const [currentYearResult, previousYearResult] = await Promise.all([
      hotelModel.aggregate(currentYearPipeline),
      hotelModel.aggregate(previousYearPipeline),
    ]);

    if (currentYearResult.length > 0 || previousYearResult.length > 0) {
      res.json({
        currentYear: currentYearResult[0] || {
          _id: {},
          revenue: 0,
          roomNights: 0,
          adr: 0,
          reservationCount: 0,
          perDayRevenue: 0,
        },
        previousYear: previousYearResult[0] || {
          _id: {},
          revenue: 0,
          roomNights: 0,
          adr: 0,
          reservationCount: 0,
          perDayRevenue: 0,
        },
      });
    } else {
      res.json({
        currentYear: {
          _id: {},
          revenue: 0,
          roomNights: 0,
          adr: 0,
          reservationCount: 0,
          perDayRevenue: 0,
        },
        previousYear: {
          _id: {},
          revenue: 0,
          roomNights: 0,
          adr: 0,
          reservationCount: 0,
          perDayRevenue: 0,
        },
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
