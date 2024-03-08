// import hotelRecord from "../model/HotelRanking.js";
// const jsonDataAdd = async (req, res) => {

//     try {
//         // Check if a file is uploaded
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded.' });
//         }

//         // Convert buffer to string
//         const fileContent = req.file.buffer.toString('utf-8');
//         const data = JSON.parse(fileContent);

//         // console.log(data)
//         await hotelRecord.create(data)
//         // console.log('data successfully imported')
//         return res.status(200).json({ message: "Data successfully uploaded" })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }

// }

// export default jsonDataAdd;

const hotelRecord = require("../models/hotelModel");
const {sendWhatsAppMessage,uploadImageToS3} = require("../helper/helper")
const fs = require('fs').promises;
// POST API endpoint to check and save data
const jsonDataAdd = async (req, res) => {

  const newRankings = req.body.newRankings; // Assuming you get newRankings from the request body

  const hotelCode = newRankings[0].hotelCode
  if (newRankings.length === 0) {
    return res.status(400).json({ message: "newRankings array cannot be empty" });
  }

  // Create an array of update operations for each newRanking
  const updateOperations = newRankings.map(({ res, hotelCode, hotelName, bookingDate, arrivalDate, deptDate, Room, pax, ADR, source, Lead, noOfNights, totalCharges, guestName, isActive }) => ({
    updateOne: {
      filter: { res, hotelCode },
      update: { res, hotelCode, hotelName, bookingDate, arrivalDate, deptDate, Room, pax, ADR, source, Lead, noOfNights, totalCharges, guestName, isActive },
      upsert: true, // Creates a new document if no match is found
    },
  }));

  try {
    // Use bulkWrite to perform multiple updateOne operations with upsert: true
    const result = await hotelRecord.bulkWrite(updateOperations, { ordered: false });

    // Extract the number of documents inserted
    const insertedCount = result.upsertedCount;
    // console.log('insertedCount: ', insertedCount);
    let dupCount = newRankings?.length - insertedCount;
    // console.log('dupCount: ', dupCount);
    // console.log(newRankings.length);
    var response;
    if (newRankings.length === dupCount) {
      response = {
        success: false,
        message: 'All entries are duplicates',
        duplicateCount: dupCount,
        insertedCount,
      };
    } else {
      response = {
        success: true,
        message: 'Data uploaded successfully',
        duplicateCount: dupCount,
        insertedCount,
      };
    }
    // console.log('response: ', response);
    // if (response.success === false) {
    //   return res.status(400).json(response);
    // }

    const pipeline = []
    const pipeline1 = []
    const pipeline2 = []
    const date = new Date();
    const today = date.toISOString().split("T")[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(date.getDate() - 6);
    const sevenDay = yesterdayDate.toISOString().split("T")[0];

    const nextDate = new Date();
    nextDate.setDate(date.getDate() + 6);
    const nextSevenDay = nextDate.toISOString().split("T")[0];

    pipeline.push(
      {
        $match: {
          isActive: "true",
          hotelCode: hotelCode,
          $or: [
            { arrivalDate: today },
            { deptDate: today }
          ]
        }
      },
      {
        $group: {
          _id: null,
          arrivals: {
            $sum: {
              $cond: [
                { $eq: ["$arrivalDate", today] },
                1,
                0
              ]
            }
          },
          departure: {
            $sum: {
              $cond: [
                { $eq: ["$deptDate", today] },
                1,
                0
              ]
            }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$arrivalDate", today] },
                "$totalCharges",
                0
              ]
            }
          },
        },
      },
      {
        $lookup: {
          from: "inventories",
          localField: hotelCode,
          foreignField: hotelCode,
          as: "inventory",
        }
      },
      {
        $unwind: "$inventory"
      },
      {
        $addFields: {
          totalRoom: "$inventory.totalInvetory",
          availableRoom: { $subtract: ["$inventory.totalInvetory", "$arrivals"] },
          ADR: {
            $cond: [
              { $ne: ["$arrivals", 0] },
              { $divide: ["$totalRevenue", "$arrivals"] },
              0
            ]
          },
        }
      },
      {
        $addFields: {
          occupancy: {
            $cond: [
              { $and: [{ $ne: ["$arrivals", 0] }, { $ne: ["$availableRoom", 0] }] },
              {
                $multiply: [
                  { $divide: ["$arrivals", "$availableRoom"] },
                  100
                ]
              },
              0
            ]
          },
        }
      },
      {
        $project: {
          _id: 0,
          arrivals: 1,
          departure: 1,
          ADR: 1,
          occupancy: 1,
          revpar: {
            $cond: [
              { $and: [{ $ne: ["$ADR", 0] }, { $ne: ["$occupancy", 0] }] },
              {
                $divide: [
                  { $multiply: ["$ADR", "$occupancy"] },
                  100
                ]
              },
              0
            ]
          },
        }

      })

    pipeline1.push(
      {
        $match: {
          isActive: "true",
          hotelCode: hotelCode,
          arrivalDate: today,
        }
      },
      {
        $group: {
          _id: "$source",
          revenue: {
            $sum: {
              $cond: { if: { $eq: ["$isActive", "true"] }, then: "$totalCharges", else: 0 },
            },
          },
          roomNights: {
            $sum: {
              $cond: { if: { $eq: ["$isActive", "true"] }, then: "$noOfNights", else: 0 },
            },
          },
          leadAverage: { $avg: { $ifNull: ["$lead", 0] } },
          reservationSet: {
            $addToSet: {
              $cond: { if: { $eq: ["$isActive", "true"] }, then: "$res", else: 0 },
            },
          },
        },
      },
      {
        $addFields: {
          los: {
            $cond: [
              { $eq: [{ $size: "$reservationSet" }, 0] },
              0,
              { $divide: ["$roomNights", { $size: "$reservationSet" }] },
            ],
          },
          reservation: { $size: "$reservationSet" }
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          revenue: 1,
          leadAverage: 1,
          los: 1,
          reservation: 1
        },
      }
    );

    pipeline2.push(
      {
        $match: {
          isActive: "true",
          hotelCode: hotelCode,
          $or: [
            { bookingDate: { $gte: sevenDay, $lte: today } },
            { arrivalDate: { $gte: today, $lte: nextSevenDay } }
          ]
        }
      },
      {
        $group: {
          _id: {
            source: "$source",
            room: "$room",
          },
          booking: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          source: "$_id.source",
          room: "$_id.room",
          booking: 1
        }
      }
    );


    const statistics = await hotelRecord.aggregate(pipeline);
    const dailyPickUp = await hotelRecord.aggregate(pipeline1);
    const lastWeekBooking = await hotelRecord.aggregate(pipeline2);
    const XLSX = require('xlsx');
    const fs = require('fs');
    
    // Combine all data into a single array
    const allData = [...statistics, ...dailyPickUp, ...lastWeekBooking];
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // //Convert all data into a single worksheet
    const worksheet = XLSX.utils.json_to_sheet(allData);
    
       // Add the worksheet to the workbook
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
   
       // Create a buffer containing the Excel file
       const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
   
       // Upload the Excel file directly to S3
       const fileUrl = await uploadImageToS3({
         originalname: 'sheet.xlsx', // Provide the original filename
         buffer: excelBuffer,
         mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Adjust mimetype as needed
       });
   
       console.log(`Excel file uploaded to S3: ${fileUrl}`);
  
       // Use the sendWhatsAppMessage function to send the file
       await sendWhatsAppMessage(fileUrl);
    return res.status(400).json({response,statistics,dailyPickUp,lastWeekBooking});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }

}
// // Check if the combination of timestamp, otaId, and cityCode is unique
// const existingRecord = await hotelRecord.findOne({ timestamp, otaId, cityCode });

// if (existingRecord) {
//   return res.status(400).json({ error: 'Duplicate entry for timestamp, otaId, and cityCode' });
// }

// // If not duplicate, save the data to the database
// const newRanking = new hotelRecord({ timestamp, otaId, extractionCount, ranking, cityCode });
// await newRanking.save();

// export default jsonDataAdd;
module.exports = jsonDataAdd;