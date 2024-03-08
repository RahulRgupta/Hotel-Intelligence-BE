const admin = require("../models/login");

module.exports = async (req, res) => {
  try {
    let updateAllUsers = await admin.updateMany({ is_password_active: true });

    return res.status(200).json({
      code: 200,
      status: true,
      message: "Updated...",
      data: updateAllUsers,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
