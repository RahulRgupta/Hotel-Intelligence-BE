const hotelModel = require("../models/hotelModel");

module.exports = async (req, res) => {
  try {
    let startDate = new Date(req.query.startDate);
    let endDate = new Date(req.query.endDate);
    let bookingStartDate = new Date(req.query.bookingStartDate);
    let bookingEndDate = new Date(req.query.bookingEndDate);
    const hotelCode = req.query.hotelCode;

    if (!hotelCode) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: " hotelCode is required",
      });
    }

    //// console.log(new Date().getSeconds(), 1);;;
    let dateArray = [];
    for (
      let date = new Date(bookingStartDate);
      date <= bookingEndDate;
      date.setDate(date.getDate() + 1)
    ) {
      dateArray.push(new Date(date));
    }
    // console.log(new Date().getSeconds(), 2);
    let arrivalDateArray = [];
    for (
      let arrivalDate = new Date(startDate);
      arrivalDate <= endDate;
      arrivalDate.setDate(arrivalDate.getDate() + 1)
    ) {
      arrivalDateArray.push(new Date(arrivalDate));
    }

    // console.log(new Date().getSeconds(), 3);

    const bookings = await hotelModel.find({
      hotelCode: hotelCode,
      bookingDate: {
        $in: dateArray.map((date) => date.toISOString().split("T")[0]),
      },
    });

    const result = dateArray.map((date) => {
      const bookingDate = date.toISOString().split("T")[0];
      const bookingsForDate = bookings.filter(
        (booking) => booking.bookingDate === bookingDate
      );

      const no_of_booking = {};
      arrivalDateArray.forEach((arrivalDate) => {
        const arrival_date = arrivalDate.toISOString().split("T")[0];
        const count = bookingsForDate.filter(
          (booking) => booking.arrivalDate === arrival_date
        ).length;
        no_of_booking[arrival_date] = count;
      });

      return {
        bookingDate: bookingDate,
        no_of_booking: no_of_booking,
        totalBookingThatDay: bookingsForDate.length,
      };
    });
    // console.log(result);

    // console.log(new Date().getSeconds(), 5);
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Pickup list.....",
      data: result,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};
