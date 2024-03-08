const hotelModel = require('../../models/hotelModel');
const { format, parse } = require('date-fns');

module.exports = async (req, res) => {
    try {
        const { hotelCode, year, month, selector, startDate, endDate, source } = req.query;

        if(!hotelCode){
            return res
            .status(400)
            .json({
              error: "hotelcode not found",
            });
          }
          
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "startdate and endDate are required" });
        }
        const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
        const formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');

        const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
        const formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');

        // console.log(formattedDate_start, formattedDate_end);

        if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
            return res.status(400).json({ error: "Invalid month. Month must be a number between 1 and 12." });
        }

        let pipeline = [];

        // Add a $match stage to filter by records with isActive: true
        pipeline.push({
            $match: {
                isActive: "true"
            }
        });


        pipeline.push({
            $addFields: {
                bookingYear: { $year: { $toDate: "$arrivalDate" } },
                bookingMonth: { $month: { $toDate: "$arrivalDate" } },
                source: "$source"
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
        }

        if (formattedDate_start && formattedDate_end) {
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

        // Group by source and arrivalDate to calculate room nights for each combination
        // pipeline.push({
        //     $group: {
        //         _id: {
        //             source: "$source",
        //             // arrivalDate: "$arrivalDate"

        //         },
        //         roomNights: { $sum: "$noOfNights" },
        //         reservationSet: { $addToSet: "$res" },
        //         totalRevenue: { $sum: "$totalCharges" },
        //     }
        // });
        switch (selector) {
            case 'yearly': {
                pipeline.push({
                    $group: {
                        _id: {
                            source: "$source",
                            // arrivalDate: "$arrivalDate"

                        },
                        roomNights: { $sum: "$noOfNights" },
                        reservationSet: { $addToSet: "$res" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalLead: { $avg: "$lead" },
                    }
                });
                break;
            }
            case 'monthly': {

                pipeline.push({
                    $group: {
                        _id: {
                            week: { $week: { $toDate: "$arrivalDate" } },
                            source: "$source",
                            // arrivalDate: "$arrivalDate"
                        },
                        roomNights: { $sum: "$noOfNights" },
                        reservationSet: { $addToSet: "$res" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalLead: { $avg: "$lead" },
                    }
                });
                break;
            }
            case 'quarterly': {
                pipeline.push({
                    $group: {
                        _id: {
                            source: "$source",
                            // arrivalDate: "$arrivalDate",
                            week: { $week: { $toDate: "$arrivalDate" } }
                        },
                        roomNights: { $sum: "$noOfNights" },
                        reservationSet: { $addToSet: "$res" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalLead: { $avg: "$lead" },
                    }
                });
                break;
            }
            default: {
                pipeline.push({
                    $group: {
                        _id: {
                            source: "$source",
                            // arrivalDate: "$arrivalDate"

                        },
                        roomNights: { $sum: "$noOfNights" },
                        reservationSet: { $addToSet: "$res" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalLead: { $avg: "$lead" },
                    }
                });
            }
        }


        pipeline.push({
            $addFields: {
                adr: { $divide: ["$totalRevenue", "$roomNights"] },
                reservationCount: { $size: "$reservationSet" }
            }
        });

        pipeline.push({
            $addFields: {
              totalLOS: { $divide: ["$roomNights", { $size: "$reservationSet" }] },
              reservationCount: { $size: "$reservationSet" },
            },
          });

        pipeline.push({
            $project: {
                reservationSet: 0, // Exclude the reservationSet field
            }
        });
        // console.log(pipeline)
        const result = await hotelModel.aggregate(pipeline);
  

        ////
        let sums={}
        result.forEach(item => {
            let source = item._id.source;
            
            if (!sums[source]) {
                sums[source] = {"_id": {
                    source
                }, "roomNights": 0, "totalRevenue": 0, "adr": 0, "reservationCount": 0};
            }
            
            sums[source].roomNights += item.roomNights;
            sums[source].totalRevenue += item.totalRevenue;
            sums[source].adr += item.adr;
            sums[source].reservationCount += item.reservationCount;
        });
        
        let sumsArray = Object.values(sums);

        if (result.length > 0) {
            res.json({ roomNightsBySourceAndArrivalDate: result,topSource:sumsArray });
        } else {
            res.json({ roomNightsBySourceAndArrivalDate: [],topSource:[] });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
