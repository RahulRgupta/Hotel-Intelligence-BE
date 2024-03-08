const cms = require("../models/cms.js");

module.exports = async (req, res) => {
  try {
    let findCms = await cms.find().lean();

    return res.status(200).json({
      code: 200,
      status: true,
      message: "CMS List",
      data: findCms,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
