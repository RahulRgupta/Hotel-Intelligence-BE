
const User = require('../../models/login'); // Assuming 'login' is your user model

module.exports = async (req, res) => {
    const { email, password,confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Enter password first", statusCode: 400 });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords don't match", statusCode: 400 });
    }

    try {
      
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $set: { password: password } }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", statusCode: 404 });
        }

        return res.status(200).json({ message: "Password updated successfully", statusCode: 200 });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", statusCode: 500 });
    }
};
