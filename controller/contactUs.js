const ContactUs = require("../models/contactUs");

module.exports = async (req, res) => {
  try {
    const {
        email,
        description
    } = req.body;

    await ContactUs.create({
        email,
        description
    });

    // Email Send TODO

    return res.status(200).json({
      code: 200,
      status: true,
      message: "We Will Contact You With in Few Days",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};