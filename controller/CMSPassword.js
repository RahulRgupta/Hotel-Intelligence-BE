const admin = require("../models/login");
const request = require("../models/req");

module.exports = async (req, res) => {
  try {
    let password = req.body.password;

    let findUser = await admin.findById({ _id: req.body._id }).lean();
    let findUserRequest = await request.findById({ _id: req.body._id }).lean();
    if (!findUser && !findUserRequest) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: "User not found",
      });
    }

    if (!findUser) {
      let channelManagerPassword = await request.findByIdAndUpdate(
        { _id: req.body._id },
        { "cmcred.Password": req.body.password, is_password_active: true },
        {
          new: true,
        }
      );

      return res.status(200).json({
        code: 200,
        status: true,
        message: "Password updated...",
      });
    }

    let channelManagerPassword = await admin.findByIdAndUpdate(
      { _id: req.body._id },
      { "cmcred.Password": req.body.password, is_password_active: true },
      {
        new: true,
      }
    );

    // console.log(channelManagerPassword,"channelManagerPasswordchannelManagerPassword")
    return res.status(200).json({
      code: 200,
      status: true,
      message: "Password updated...",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

