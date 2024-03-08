const hotelModel = require('../models/hotelModel');

module.exports = async (req, res) => {
    try {
        const { hotelCode, month } = req.query

        if (!hotelCode) {
            return res
                .status(400)
                .json({
                    message: "Please enter a hotel code first", statuscode: 400
                });
        }
        const inputDate = new Date(month);

        const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 2);

        const lastMonthStartDate = new Date(inputDate.getFullYear(), inputDate.getMonth() - 1, 2);

        const weeklyRevenueForCurrentMonth = Array.from({ length: 4 }, (_, index) => {
            const weekStartDate = new Date(startDate);
            weekStartDate.setDate(weekStartDate.getDate() + (index * 7));

            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            const weekStartFormatted = weekStartDate.toISOString().split('T')[0];
            const weekEndFormatted = weekEndDate.toISOString().split('T')[0];

            return {
                week: `Week ${index + 1}`,
                totalRevenue: 0,
                startDate: weekStartFormatted,
                endDate: weekEndFormatted
            };
        });

        const weeklyRevenueForLastMonth = Array.from({ length: 4 }, (_, index) => {
            const weekStartDate = new Date(lastMonthStartDate);
            weekStartDate.setDate(weekStartDate.getDate() + (index * 7));

            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            const weekStartFormatted = weekStartDate.toISOString().split('T')[0];
            const weekEndFormatted = weekEndDate.toISOString().split('T')[0];

            return {
                week: `Week ${index + 1}`,
                totalRevenue: 0,
                startDate: weekStartFormatted,
                endDate: weekEndFormatted
            };
        });

        const calculateWeeklyRevenue = async (weeklyArray) => {
            for (let i = 0; i < weeklyArray.length; i++) {
                const currentWeek = weeklyArray[i];

                const currentWeekStart = new Date(currentWeek.startDate).toISOString().split('T')[0];

                const currentWeekEnd = new Date(currentWeek.endDate).toISOString().split('T')[0];

                const currentWeekResult = await hotelModel.aggregate([
                    {
                        $match: {
                            isActive: "true",
                            hotelCode: hotelCode,
                            arrivalDate: { $gte: currentWeekStart, $lte: currentWeekEnd }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            arrivals: { $sum: 1 },
                            totalRevenue: { $sum: "$totalCharges" },
                            noOfNights: { $sum: "$noOfNights" }
                        }
                    },
                    {
                        $addFields: {
                            ADR: {
                                $cond: [
                                    { $ne: ["$arrivals", 0] },
                                    { $divide: ["$totalRevenue", "$arrivals"] },
                                    0
                                ]
                            },
                        }
                    }
                ]);

                currentWeek.totalRevenue = currentWeekResult.length > 0 ? currentWeekResult[0].totalRevenue : 0;
                currentWeek.arrivals = currentWeekResult.length > 0 ? currentWeekResult[0].arrivals : 0;
                currentWeek.noOfNights = currentWeekResult.length > 0 ? currentWeekResult[0].noOfNights : 0;
                currentWeek.ADR = currentWeekResult.length > 0 ? currentWeekResult[0].ADR : 0;
            }
        };

        await calculateWeeklyRevenue(weeklyRevenueForLastMonth);
        await calculateWeeklyRevenue(weeklyRevenueForCurrentMonth);

        return res.status(200).json({
            message: "Revenue of last two months",
            statuscode: 200,
            weeklyRevenueForLastMonth,
            weeklyRevenueForCurrentMonth
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error", statuscode: 500 });
    }
}