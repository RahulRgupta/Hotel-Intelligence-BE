const randomstring = require("randomstring");
const userAccount = require("../../models/login");

const verifyOtp = async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "OTP is missing", statusCode: 400 });
    }

    try {
        const tenMinutesAgo = new Date(new Date().getTime() - 1 * 60 * 1000);
        const utcTimestamp = tenMinutesAgo.toISOString();
        
        const userDetails = await userAccount.findOne({ otp: otp, time: { $gte: utcTimestamp } });
        
        if (!userDetails) {
            return res.status(400).json({ message: "Incorrect or expired OTP", statusCode: 400 });
        }c

        // Update isOtpVerified to true
        await userAccount.updateOne({ otp: otp }, { $set: { otp: "", time: "", isOtpVerified: "true" } });

        return res.status(200).json({ message: "OTP verified successfully", statusCode: 200 });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", statusCode: 500 });
    }
};

module.exports = verifyOtp;
