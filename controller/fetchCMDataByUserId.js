const loginModel = require('../models/login');

module.exports = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is missing in the request" });
        }

        const cmData = await loginModel.findOne({ userId, is_correct: "true" });

        if (!cmData) {
            return res.status(404).json({ error: "No data found for the provided user ID and correct flag" });
        }

        return res.status(200).json(cmData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
