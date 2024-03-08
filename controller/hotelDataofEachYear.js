
const { parse, format } = require('date-fns');
const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode, selector, year, month, startDate, endDate, source } = req.query;
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

        const startYear = 2017;
        const endYear = 2025;

        if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
            return res.status(400).json({ error: "Invalid month. Month must be a number between 1 and 12." });
        }

        let pipeline = [];

        pipeline.push({
            $match: {
                isActive: "true",
                arrivalDate: {
                    $gte: "01-01-17",
                    $lte: "31-12-25"
                }
            }
        });
        if (hotelCode) {
            const hotelCodeArray = hotelCode.split(",");
            pipeline.push({
                $match: {
                    hotelCode: { $in: hotelCodeArray }
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

        pipeline.push({
            $addFields: {
                bookingYear: { $year: { $toDate: "$arrivalDate" } },
                bookingMonth: { $month: { $toDate: "$arrivalDate" } }
            }
        });

        if (startDate && endDate) {
            // console.log(startDate)
            // console.log(endDate)
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

        if (year) {
            const yearsArray = year.split(",").map(Number);
            pipeline.push({
                $match: {
                    bookingYear: { $in: yearsArray }
                }
            });
        }

        if (month) {
            const monthsArray = month.split(",").map(Number);
            pipeline.push({
                $match: {
                    bookingMonth: { $in: monthsArray }
                }
            });
        }

        // pipeline.push({
        //     $group: {
        //         _id: { year: "$bookingYear", month: "$bookingMonth" },
        //         totalRevenue: { $sum: "$totalCharges" },
        //         totalRoomNights: { $sum: "$noOfNights" },
        //         totalLead: { $sum: "$lead"},
        //         roomNights: { $sum: "$noOfNights" },
        //         reservationCount: { $addToSet: "$res" },
        //     }
        // });
        switch (selector) {
            case 'yearly': {
                pipeline.push({
                    $addFields: {
                        arrivalDate: { $toDate: "$arrivalDate" }
                    }
                });
                pipeline.push({
                    $group: {
                        _id: { year: "$bookingYear", month: "$bookingMonth" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalRoomNights: { $sum: "$noOfNights" },
                        totalLead: { $sum: "$lead" },
                        reservationCount: { $addToSet: "$res" },
                        roomNights: { $sum: "$noOfNights" },
                        startOfMonth: {
                            $first: {
                                $dateFromParts: {
                                    'year': "$bookingYear",
                                    'month': "$bookingMonth",
                                    'day': 1
                                }
                            }
                        }
                    }
                });
                // Sort the results in ascending order by year and month
                pipeline.push({
                    $sort: {
                        startOfMonth: 1, // Use -1 for descending order
                        "_id.month": 1
                    }
                });
                break;
            }
            case 'monthly': {
                // for frondend purpose week number is entered as year
                pipeline.push({
                    $addFields: {
                        arrivalDate: { $toDate: "$arrivalDate" }
                    }
                });
                pipeline.push({
                    $group: {
                        _id: {
                            year: { $week: "$arrivalDate" }, yearr: "$bookingYear"
                        },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalRoomNights: { $sum: "$noOfNights" },
                        totalLead: { $sum: "$lead" },
                        roomNights: { $sum: "$noOfNights" },
                        reservationCount: { $addToSet: "$res" },
                        dateStart: {
                            $first: {
                                $dateFromParts: {
                                    isoWeekYear: { $isoWeekYear: "$arrivalDate" },
                                    isoWeek: { $isoWeek: "$arrivalDate" },
                                    isoDayOfWeek: 1
                                }
                            }
                        }
                    }
                });
                pipeline.push({
                    $sort: {
                        dateStart: 1, // Use -1 for descending order
                        "_id.year": 1
                    }
                });

                break;
            }
            case 'quarterly': {
                pipeline.push({
                    $addFields: {
                        arrivalDate: { $toDate: "$arrivalDate" }
                    }
                });
                pipeline.push({
                    $group: {
                        _id: {
                            year: { $week: { $toDate: "$arrivalDate" } }
                        },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalRoomNights: { $sum: "$noOfNights" },
                        totalLead: { $sum: "$lead" },
                        roomNights: { $sum: "$noOfNights" },
                        reservationCount: { $addToSet: "$res" },
                        dateStart: {
                            $first: {
                                $dateFromParts: {
                                    isoWeekYear: { $isoWeekYear: "$arrivalDate" },
                                    isoWeek: { $isoWeek: "$arrivalDate" },
                                    isoDayOfWeek: 1
                                }
                            }
                        }
                    }
                });
                pipeline.push({
                    $sort: {
                        dateStart: 1, // Use -1 for descending order
                        "_id.year": 1
                    }
                });
                break;
            }
            case 'custom': {
                var differenceInDays = Math.floor((parsedDate_end - parsedDate_start) / (1000 * 60 * 60 * 24));
             console.log(differenceInDays)
                if (differenceInDays <=12) {
                    // If the date range is within 7 days, fetch data day-wise
                    pipeline.push({
                        $match: {
                            $expr: {
                                $and: [
                                    { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
                                    { $lte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
                                ]
                            }
                        }
                    });
            
                    pipeline.push({
                        $group: {
                            _id: {
                                year: { $year: { $dateFromString: { dateString: "$arrivalDate" } } },
                                month: { $month: { $dateFromString: { dateString: "$arrivalDate" } } },
                                day: { $dayOfMonth: { $dateFromString: { dateString: "$arrivalDate" } } }
                            },
                            totalRevenue: { $sum: "$totalCharges" },
                            totalRoomNights: { $sum: "$noOfNights" },
                            totalLead: { $sum: "$lead" },
                            roomNights: { $sum: "$noOfNights" },
                            reservationCount: { $addToSet: "$res" },
                        }
                    });
            
                    pipeline.push({
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1,
                            "_id.day": 1
                        }
                    });
                    // pipeline.push({
                    //     $addFields: {
                    //         reservationCount: { $size: "$reservationCount" } // Calculate the count of reservations per day
                    //     }
                    // });
                } else if (differenceInDays > 12 && differenceInDays <= 30){
                    console.log("xhnmnbvbn")
                    // Aggregate data in groups of three days if more than 12 days' data
                    pipeline.push({
                        $match: {
                            $expr: {
                                $and: [
                                    { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
                                    { $lte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
                                ]
                            }
                        }
                    });
            
                    pipeline.push({
                        $group: {
                            _id: {
                                year: { $year: { $toDate: "$arrivalDate" } },
                                dayOfYear: { $dayOfYear: { $toDate: "$arrivalDate" } }
                            },
                            totalRevenue: { $sum: "$totalCharges" },
                            totalRoomNights: { $sum: "$noOfNights" },
                            totalLead: { $sum: "$lead" },
                            roomNights: { $sum: "$noOfNights" },
                            reservationCount: { $addToSet: "$res" },
                        }
                    });
            
                    // Logic to group by every three days within a month
                    pipeline.push({
                        $addFields: {
                            dayGroup: {
                                $subtract: [
                                    "$_id.dayOfYear",
                                    { $mod: ["$_id.dayOfYear", 3] }
                                ]
                            }
                        }
                    });
            
                    pipeline.push({
                        $group: {
                            _id: {
                                year: "$_id.year",
                                dayGroup: "$dayGroup"
                            },
                            totalRevenue: { $sum: "$totalRevenue" },
                            totalRoomNights: { $sum: "$totalRoomNights" },
                            totalLead: { $sum: "$totalLead" },
                            roomNights: { $sum: "$roomNights" },
                            reservationCount: { $addToSet: "$reservationCount" },
                        }
                    });
            
                    pipeline.push({
                        $sort: {
                            "_id.year": 1,
                            "_id.dayGroup": 1
                        }

                    });
                    
                } else if (differenceInDays > 30) {
                    console.log("sdfghjk")
                    pipeline.push({
                        $addFields: {
                            arrivalDate: { $toDate: "$arrivalDate" }
                        }
                    });
            
                    pipeline.push({
                        $group: {
                            _id: {
                                year: { $isoWeekYear: "$arrivalDate" },
                                week: { $isoWeek: "$arrivalDate" }
                            },
                            totalRevenue: { $sum: "$totalCharges" },
                            totalRoomNights: { $sum: "$noOfNights" },
                            totalLead: { $sum: "$lead" },
                            roomNights: { $sum: "$noOfNights" },
                            reservationCount: { $addToSet: "$res" },
                        }
                    });
            
                    pipeline.push({
                        $sort: {
                            "_id.year": 1,
                            "_id.week": 1
                        }
                    });
                }
                break;
                }
            
            default: {
                pipeline.push({
                    $group: {
                        _id: { year: "$bookingYear", month: "$bookingMonth" },
                        totalRevenue: { $sum: "$totalCharges" },
                        totalRoomNights: { $sum: "$noOfNights" },
                        totalLead: { $sum: "$Lead" },
                        reservationCount: { $addToSet: "$res" },
                        roomNights: { $sum: "$noOfNights" },
                        dateStart: {
                            $first: {
                                $dateFromParts: {
                                    'year': "$bookingYear",
                                    'month': "$bookingMonth",
                                    'day': 1
                                }
                            }
                        }
                    }
                });
                pipeline.push({
                    $sort: {
                        dateStart: 1,
                        "_id.month": 1
                    }
                });
            }
        }
        pipeline.push({
            $addFields: {
                totalADR: {
                    $cond: {
                        if: { $gt: ["$totalRoomNights", 0] },
                        then: { $divide: ["$totalRevenue", "$totalRoomNights"] },
                        else: 0 // Replace with a default value or handle differently based on your use case
                    }
                },
                totalLOS: {
                    $cond: {
                        if: { $ne: [{ $size: "$reservationCount" }, 0] },
                        then: { $divide: ["$roomNights", { $size: "$reservationCount" }] },
                        else: 0 // Replace with a default value or handle differently based on your use case
                    }
                }
            }
        });
      
       
        

        pipeline.push({
            $project: {
                _id: 1,
                totalRevenue: 1,
                totalRoomNights: 1,
                totalLead: 1,
                reservationCount: {
                    $cond: {
                        if: { $isArray: "$reservationCount" },
                        then: { $size: "$reservationCount" },
                        else: 0 // Replace with a default value or handle differently based on your use case
                    }
                },
                roomNights: 1,
                startOfMonth: 1,
                totalADR: 1,
                totalLOS: 1,
                dateStart: 1
            }
        })



        const monthlyResult = await hotelModel.aggregate(pipeline);

       // pipeline.pop();
       pipeline.pop();

        // Calculate yearly totals
        let yearlyPipeline = pipeline;
        if(differenceInDays > 12 && differenceInDays <= 30 ) {
            yearlyPipeline = pipeline?.slice(0,-5)
        } else {
            yearlyPipeline = pipeline?.slice(0,-4)
        }
         // Remove the $group and $addFields stages
        //const yearlyPipeline = pipeline.slice(0, -2); // Remove the $group and $addFields stages
        yearlyPipeline.push({
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalCharges" },
                totalRoomNights: { $sum: "$noOfNights" },
                totalLead: { $avg: "$lead" },
                roomNights: { $sum: "$noOfNights" },
                reservationCount: { $addToSet: "$res" },
            }
        });

        yearlyPipeline.push({
            $addFields: {
                totalADR: {
                    $cond: {
                        if: { $gt: ["$totalRoomNights", 0] },
                        then: { $divide: ["$totalRevenue", "$totalRoomNights"] },
                        else: 0 // Replace with a default value or handle differently based on your use case
                    }
                },
                totalLOS: {
                    $cond: {
                        if: { $ne: [{ $size: "$reservationCount" }, 0] },
                        then: { $divide: ["$roomNights", { $size: "$reservationCount" }] },
                        else: 0 // Replace with a default value or handle differently based on your use case
                    }
                },
                totalReservation: { $size: "$reservationCount" }
            }
           
        });
        

        yearlyPipeline.push({
            $project: {
                totalRevenue: 1,
                totalRoomNights: 1,
                totalLOS: 1,
                totalADR: 1,
                totalLead:1,
                totalReservation: 1
            }
        })

        // // Sort the yearly results in ascending order by year
        // yearlyPipeline.push({
        //     $sort: { "_id.year": 1 }
        // });

        const yearlyResult = await hotelModel.aggregate(yearlyPipeline);

        if (yearlyResult.length > 0 || monthlyResult.length > 0) {
            res.json({ yearlyTotals: yearlyResult, monthlyTotals: monthlyResult });
        } else {
            res.json({ yearlyTotals: [], monthlyTotals: [] });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}




