const admin = require("../../models/login");
const request = require("../../models/req");
const { jwtsign } = require("../../helper/helper");
const hotel = require("../../models/hotelModel");


module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
   

    let userProfile = await admin.findOne({ email }).lean();
    let findUser = await request.findOne({ email }).lean();

    const ProfilePassword = findUser?.password || '';
    const ProfileUserId = findUser?.userId || ''
    const data = async (res) => {
      res.status(401).send({
        code: 401,
        status: false,
        message: "Invalid password"
      });
    };

    if (!userProfile && !findUser) {
      return res.status(404).json({ message: "User Profile Not Found" });

    } else if (!userProfile && findUser && !findUser.is_password_active) {
      return res.status(200).json({
        message: "Channel manager password is not active please update",
        _id: findUser._id,
        userId: ProfileUserId,
        is_password_active: findUser.is_password_active,
      });
    } else if (userProfile && !userProfile.is_password_active) {
      return res.status(200).json({
        message: "Channel manager password is not active please update",
        _id: userProfile._id,
        userId: ProfileUserId,
        is_password_active: userProfile.is_password_active,
      });
    } else if (!userProfile && findUser && findUser.is_channelManager === "false") {
      return res.status(200).json({ message: "CMDataEmpty", userId: ProfileUserId, });
    } else if ((!userProfile && findUser && findUser.is_password_active && findUser.is_correct === "") || (!userProfile && findUser && findUser.is_password_active && findUser.is_correct === "false" && findUser.is_credentialsChange === "true")) {
      return res.status(200).json({ message: "underProcess", is_request: true, userId: ProfileUserId });
    } else if (!userProfile && findUser && findUser.is_correct === "false") {
      return res.status(200).json({ message: "rejected", userId: ProfileUserId });
    } else if (userProfile.is_connected === "false") {
      return res.status(200).json({ message: "cmDisconnected", userId: ProfileUserId });
    }

    const userProfilePassword = userProfile?.password || '';

    const userProfleIsAdmin = userProfile?.is_admin || '';
    const userProfileEmail = userProfile?.email || '';
    const userProfileUserId = userProfile?.userId || '';
    const userHotelCodes = userProfile?.hotelCode || [];

    if (userProfile && findUser && userProfile.is_correct === "true" || userProfile && userProfile.is_correct === "true") {
      if (password !== userProfilePassword && password !== ProfilePassword) {
        await data(res)
      } else {

        const hotelCodes = userHotelCodes.map((hotel) => hotel.hotelCode);
        //console.log(hotelCodes)

        const matchingHotels = await hotel.aggregate([
          { $match: { hotelCode: { $in: hotelCodes } } },
          {
            $group: {
              _id: null,
              hotels: { 
                $addToSet: {
                  hotelName: "$hotelName",
                  hotelCode: "$hotelCode"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              hotels: 1
            }
          },
          {
            $limit: 200 // Example: Apply a limit to the results 
          }
        ]);

        console.log(matchingHotels)

        const hotelData = matchingHotels.length ? matchingHotels[0].hotels : [];
        //console.log(hotelNames)

        if (hotelData.length === 0) {

          return res.status(200).json({ message: "collectingData", userId: userProfileUserId });
        }

        const token = await jwtsign({ email });


        return res.status(200).json({
          message: "Login successful",
          //hotelData,
          hotelData,
          token,
          _id: userProfile._id,
          email: userProfileEmail,
          userId: userProfileUserId,
          is_admin: userProfleIsAdmin,
          is_password_active: userProfile.is_password_active,
        });

      }


    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
