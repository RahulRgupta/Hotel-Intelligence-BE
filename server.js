require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

require("./conn/db2")
require("./conn/db")

app.use(bodyParser.json());
app.use(express.json());


app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
    origin: '*'
}));

//login
const login = require('./routers/login/loginRouter')
const sendMail = require('./routers/login/sendMailRouter')
const otpVerification = require('./routers/login/otpVerificationRouter')
const resetPassword = require('./routers/login/ResetPwdRouter')
const updateCMData = require('./routers/login/patchCMDataRouter')
const verifyAccountData = require('./routers/login/verifyAccountRouter')
const switchToRs = require("./routers/login/switchToRsrouter")

//hoteldata
const hotel = require('./routers/hotelListRouter')
const hotelData = require('./routers/hotelData');
const hoteldataYear = require('./routers/hotelDataOfEachYearRouter');
const chartdata = require('./routers/chartDataRouter')
const weekdata = require('./routers/weekEndDataRouter')
const totalReservation = require('./routers/totalReservationOfEachRoomRouter')
const searchDataByYear = require('./routers/searchHotelDataByYear')
const uniqueYearAndMonth = require('./routers/fetchUniqueYearAndMonthByHotelName')
const userReq = require('./routers/request.routes')
const cmList = require('./routers/cms.routes')
const cmsPassword = require('./routers/passwordCMS.routes')
const test = require('./routers/test.routes')
const sourceListData = require('./routers/sourceListRouter')
const fetchCMDataByUserId = require('./routers/fetchCMDataByUserIdRouter')
const disconnectChannelManager = require('./routers/disconnectChannelManagerRouter')
const fetchArrivalDateByHotelName = require('./routers/fetchLatestArrivalDateByHotelName')
const addHotelCodeData = require('./routers/addhotelCodeRouter')
const uploadHotelData = require('./routers/uploadHotelRecordDataRouter')
const todayData = require('./routers/todayUpdateRouter')


const contactus = require('./routers/contactUs')
const emailExist = require('./routers/emailExist')
const RS_login = require('./routers/checkRSEmail')
const pickupReportRouter = require('./routers/pickUpReportRouter');
const comparisonRouter = require('./routers/comparison.router');
const hotelRecord = require('./routers/uploadHotelRecordRouter')
const occupancyRecord = require('./routers/occupanyRouter')

//LevelTwo
const latestHotelData = require('./routers/levelTwo/getHotelDataLetestRouter')
const levelTwoChart = require('./routers/levelTwo/getChartDataRouter')
const roomNightSource = require('./routers/levelTwo/getRoomNightOfEachSource')
const arrivalData = require('./routers/levelTwo/getArrivalDataRouter')
const arrivalCount = require('./routers/levelTwo/getArrivalCountByWeekRouter');
const { default: db2 } = require('./conn/db2');


const jsondata = require("./routers/jsonUpload");
const getRevenue = require('./routers/getRevenue');
const pickUp= require('./routers/pickUpRouter');
const bookingDetails= require('./routers/bookingDetails')
const getFilter=require('./routers/getFilterRoute')
const getComparison=require('./routers/getComparisonRoute')

//login
app.use(login)
app.use(sendMail)
app.use(otpVerification)
app.use(resetPassword)
app.use(updateCMData)
app.use(verifyAccountData)
app.use(switchToRs)

//
app.use(hotel)
app.use(hotelData)
app.use(hoteldataYear)
app.use(chartdata)
app.use(weekdata)
app.use(totalReservation)
app.use(searchDataByYear)
app.use(uniqueYearAndMonth)
app.use(sourceListData)
app.use(fetchCMDataByUserId)
app.use(disconnectChannelManager)
app.use(fetchArrivalDateByHotelName)
app.use(addHotelCodeData)
app.use(pickupReportRouter);
app.use(comparisonRouter)
app.use(todayData)
app.use(bookingDetails)

//LevelTwo
app.use(latestHotelData)
app.use(levelTwoChart)
app.use(roomNightSource)
app.use(arrivalData)
app.use(arrivalCount)
app.use(userReq)
app.use(cmList)
app.use(cmsPassword)
app.use(contactus)
app.use(test)
app.use(emailExist)

// mongoose.connect(process.env.DATABASE, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(() => console.log('Connected to DB'))
//     .catch(err => {
//         console.log(err, "mongo_error");
// });


// mongoose.rateshopper = mongoose.createConnection(process.env.DATABASE2, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })

// connectDb()
app.use(jsondata)
app.use(RS_login)
app.use(hotelRecord)
app.use(occupancyRecord)
app.use(getRevenue)
app.use(pickUp)
app.use(getFilter)
app.use(getComparison)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
