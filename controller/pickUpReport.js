const hotelModel = require('../models/hotelModel')
const { formatDate } = require('../helper/helper')
const { format, parse } = require('date-fns');

module.exports = async (req, res) => {
    try {
        const { hotelCode, selector, pickupDate } = req.query

        let startDate;
        let endDate;
        let formattedDate_end;
        let formattedDate_start;

        if (!hotelCode) {
            return res.status(400).json({ error: "hotelcode not found" })
        }

        if (!pickupDate) {
            return res.status(400).json({ error: "pickupDate not provided" })
        }


        let pipeline = []

        pipeline.push({
            $match: {
                isActive: "true"
            }
        })

        pipeline.push({
            $addFields: {
                bookingYear: { $year: { $toDate: "$arrivalDate" } },
                //bookingMonth: { $month: { $toDate: "$arrivalDate" } },
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
                    // bookingMonth: { $month: { $toDate: "$arrivalDate" } }
                }
            });

        }

        switch (selector) {
            case 'yesterday': {
                startDate = new Date(pickupDate);
                startDate.setDate(startDate.getDate() - 1); // Subtract 1 day for yesterday
            
                startDate = formatDate(startDate);
            
                const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
                formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');
                pipeline.push({
                    $match: {
                        $expr: {
                            $eq: [
                                {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: { $toDate: "$bookingDate" } // Convert bookingDate to Date
                                    }
                                },
                                formattedDate_start
                            ]
                        }
                    }
                });
                break;
            }
            

            case 'thisMonth': {
                let currentDate = new Date(pickupDate);
                const dateVar = req.query.dateVar;
                if (dateVar === 'Actual') {
                    // Initialize startDate to the first day of the next month
                    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    startDate = formatDate(startDate)
                    endDate = formatDate(currentDate);
                } else if (dateVar === 'BOB') {
                    startDate = formatDate(currentDate);
                    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    endDate = formatDate(endDate);
                } else {
                    return res.status(400).json({ message: 'Please enter a valid dateVar' })
                }

                // console.log(startDate, endDate);
                const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
                formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');
                // console.log('formattedDate_start: ', formattedDate_start);

                const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
                formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');
                // console.log('formattedDate_end: ', formattedDate_end);

                pipeline.push({
                    $match: {
                        $expr: {
                            $and: [
                                { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
                                { $lt: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
                            ]
                        }
                    }
                });

                break;
            }

            case 'nextMonth': {
                let currentDate = new Date(pickupDate);

                // Initialize startDate to the first day of the next month
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

                // Initialize endDate to the last day of the same month
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

                startDate = formatDate(startDate);
                endDate = formatDate(endDate);

                // console.log(startDate, endDate);
                const parsedDate_start = parse(startDate, 'dd-MM-yyyy', new Date());
                formattedDate_start = format(parsedDate_start, 'yyyy-MM-dd');
                // console.log('formattedDate_start: ', formattedDate_start);

                const parsedDate_end = parse(endDate, 'dd-MM-yyyy', new Date());
                formattedDate_end = format(parsedDate_end, 'yyyy-MM-dd');
                // console.log('formattedDate_end: ', formattedDate_end);

                pipeline.push({
                    $match: {
                        $expr: {
                            $and: [
                                { $gte: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_start)] },
                                { $lt: [{ $dateFromString: { dateString: "$arrivalDate" } }, new Date(formattedDate_end)] }
                            ]
                        }
                    }
                });
                break;
            }

            default: {
                return res.status(400).json({ message: "Invalid selector variable" })
            }

        }

        pipeline.push({
            $group: {
                _id: {
                    source: "$source",
                    // arrivalDate: "$arrivalDate"
                },
                roomNight: { $sum: "$noOfNights" },
                reservationSet: { $addToSet: "$res" },
                revenue: { $sum: "$totalCharges" },
                lead: { $avg: "$lead" }
            }
        });

        pipeline.push({
            $addFields: {
                adr: { $divide: ["$revenue", "$roomNight"] },
                reservation: { $size: "$reservationSet" },
                los: { $divide: ["$roomNight", { $size: "$reservationSet" }] }
            }
        });

        pipeline.push({
            $project: {
                _id: 0,
                source: "$_id.source",
                roomNight: 1,
                revenue: 1,
                adr: 1,
                los: 1,
                lead: 1,
                reservation: 1
            }
        });
        // console.log(pipeline)
        const result = await hotelModel.aggregate(pipeline);

        if (result.length > 0) {
            res.status(200).json({ data: result });
        } else {
            res.status(200).json({ data: [] });
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" });
    }
}