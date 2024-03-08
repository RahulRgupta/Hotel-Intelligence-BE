const { parse, format } = require('date-fns');
const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
  try {
    // Extract the 'year' parameter from the request query
    const { hotelCode, selector, startDate, endDate, source } = req.query;

    if(!hotelCode){
      return res
      .status(400)
      .json({
        error: "hotelCode not found",
      });
    }
    

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startdate and endDate are required" });
    }
    const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
    const formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');

    const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
    const formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');
    let pipeline = []

    pipeline.push({
      $addFields: {
        room: "$room"
      }
    });

    // Add a $match stage to filter by records with isActive: true
    pipeline.push({
      $match: {
        isActive: "true"
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

      // Add a $addFields stage to extract the year and month from arrivalDate
      pipeline.push({
        $addFields: {
          bookingYear: { $year: { $toDate: "$arrivalDate" } },
          bookingMonth: { $month: { $toDate: "$arrivalDate" } }
        }
      });
    }

    if (source) {
      const sourceArray = source.split(",");
      pipeline.push({
        $match: {
          source: { $in: sourceArray }
        }
      });
      // console.log("dsfased")
    }


    if (startDate && endDate) {
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
      if (selector === 'monthly') {
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $month: { $dateFromString: { dateString: "$arrivalDate" } } }, { $month: new Date(formattedDate_start) }] },
              ]
            }
          }
        })
      }
    }


    // pipeline.push({
    //   $group: {
    //     _id: { room: '$room', year: "$bookingYear" },
    //     reservationCount: { $addToSet: "$res" },
    //     totalRevenue: { $sum: "$totalCharges" },
    //     roomNights: { $sum: "$noOfNights" },
    //   }
    // });
    switch (selector) {
      case 'yearly': {
        pipeline.push({
          $group: {
            _id: { room: '$room', year: "$bookingYear" },
            reservationCount: { $addToSet: "$res" },
            totalRevenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
          }
        });
        break;
      }
      case 'monthly': {
        // console.log("monthly");

        pipeline.push({
          $group: {
            _id: { room: '$room', year: "$bookingYear", week: { $week: { $toDate: "$arrivalDate" } } },
            reservationCount: { $addToSet: "$res" },
            totalRevenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
          }
        });
        break;
      }
      case 'quarterly': {
        pipeline.push({
          $group: {
            _id: {
              room: '$room',
              year: "$bookingYear",
              week: { $week: { $toDate: "$arrivalDate" } }
            },
            reservationCount: { $addToSet: "$res" },
            totalRevenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
          }
        });
        break;
      }
      default: {
        pipeline.push({
          $group: {
            _id: { room: '$room', year: "$bookingYear" },
            reservationCount: { $addToSet: "$res" },
            totalRevenue: { $sum: "$totalCharges" },
            roomNights: { $sum: "$noOfNights" },
          }
        });
      }
    }


    // //totalreservation count
    // pipeline.push({
    //   $addFields: {
    //     adr: { $divide: ["$totalRevenue", "$roomNights"] },
    //     totalReservation: { $size: "$reservationCount" }
    //   }
    // });

    // Add a condition to check if roomNights is not zero before division
pipeline.push({
  $addFields: {
    adr: {
      $cond: {
        if: { $gt: ["$roomNights", 0] }, // Check if roomNights is greater than zero
        then: { $divide: ["$totalRevenue", "$roomNights"] }, // Perform division
        else: 0 // Set ADR to 0 if roomNights is zero
      }
    },
    totalReservation: { $size: "$reservationCount" }
  }
});





    const result = await hotelModel.aggregate(pipeline);
    // const totalReservationsByRoom = result.map(result => ({
    //     Room: result._id.room,
    //     totalReservations: result.totalReservations
    // }));

    // res.json(totalReservationsByRoom);




    // Separate the array of "Room" and "totalReservations"
    const rooms = result.map(result => result._id.room);
    const totalReservations = result.map(result => result.totalReservation);
    const totalAdr = result.map(result => result.adr);
    const totalRevenue = result.map(result => result.totalRevenue);
    const roomNights = result.map(result => result.roomNights);

    const mergedData = new Map();

    if (selector === 'monthly' || selector === 'quarterly') {
      for (const item of result) {
        const weekKey = item._id.week;

        if (mergedData.has(weekKey)) {
          // Week data already exists, update it
          const existingData = mergedData.get(weekKey);
          existingData.totalRevenue.push(item.totalRevenue);
          existingData.Room.push(item._id.room);
          existingData.roomNights.push(item.roomNights);
          existingData.totalReservations.push(item.totalReservation);
          existingData.totalAdr.push(item.adr);
        } else {
          // Week data doesn't exist, create a new entry
          mergedData.set(weekKey, {
            _id: { year: item._id.year, week: item._id.week },
            Room: [item._id.room], // Initialize as an array
            totalReservations: [item.totalReservation], // Initialize as an array
            roomNights: [item.roomNights], // Initialize as a number
            totalRevenue: [item.totalRevenue], // Initialize as a number
            totalAdr: [item.adr], // Initialize as a number
          });
        }
      }

      const mergedResult = [...mergedData.values()];
      
      mergedResult.sort((a, b) => a._id.week - b._id.week);
      const aggregatedData = {};

      mergedResult.forEach((item) => {
        item.Room.forEach((room, index) => {
            if (!aggregatedData[room]) {
                aggregatedData[room] = {
                    room : room,
                    totalReservations: 0,
                    roomNights: 0,
                    totalRevenue: 0,
                    totalAdr: 0
                };
            }
    
            aggregatedData[room].totalReservations += item.totalReservations[index];
            aggregatedData[room].roomNights += item.roomNights[index];
            aggregatedData[room].totalRevenue += item.totalRevenue[index];
            aggregatedData[room].totalAdr += item.totalAdr[index];
        });
    });

let sumsArray = Object.values(aggregatedData);

      return res.status(200).json({mergedResult, totalRoomType: sumsArray});
    } else {

      const data = {
        Room: rooms, totalReservations: totalReservations, totalAdr: totalAdr, roomNights: roomNights, totalRevenue: totalRevenue
      }
      const aggregatedData = {};
data.Room.forEach((room, index) => {
    if (!aggregatedData[room]) {
        aggregatedData[room] = {
            room : room,
            totalReservations: 0,
            totalAdr: 0,
            roomNights: 0,
            totalRevenue: 0
        };
    }

    aggregatedData[room].totalReservations += data.totalReservations[index];
    aggregatedData[room].totalAdr += data.totalAdr[index];
    aggregatedData[room].roomNights += data.roomNights[index];
    aggregatedData[room].totalRevenue += data.totalRevenue[index];
});


let sumsArray = Object.values(aggregatedData);

      res.json({
        Room: rooms, totalReservations: totalReservations, totalAdr: totalAdr, roomNights: roomNights, totalRevenue: totalRevenue,totalRoomType:sumsArray
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }

};